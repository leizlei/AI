import {View, ScrollView} from 'react-native';
import React, {useState, useCallback, useContext} from 'react';

import {v4 as uuidv4} from 'uuid';
import {observer} from 'mobx-react';
import RNDeviceInfo from 'react-native-device-info';
import {Slider} from '../../components/libraryViews';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text, Button, Card, ActivityIndicator, Icon} from 'react-native-paper';

import {submitBenchmark} from '../../api/benchmark';

import {Menu, Dialog, Checkbox} from '../../components';

import {useTheme} from '../../hooks';
import {L10nContext} from '../../utils';
import {t} from '../../locales';

import {createStyles} from './styles';
import {DeviceInfoCard} from './DeviceInfoCard';
import {BenchResultCard} from './BenchResultCard';

import {modelStore, benchmarkStore, uiStore} from '../../store';
import {
  runGpuLayerSweep,
  type SweepCellResult,
  type SweepOutcome,
  type SweepProgress,
} from '../../services/gpuLayerSweep';
import * as RNFS from '@dr.pogodin/react-native-fs';
import Share from 'react-native-share';

import type {DeviceInfo, Model} from '../../utils/types';
import {BenchmarkConfig, BenchmarkResult, ModelOrigin} from '../../utils/types';

const DEFAULT_CONFIGS: BenchmarkConfig[] = [
  {pp: 512, tg: 128, pl: 1, nr: 3, label: 'Default'},
  {pp: 128, tg: 32, pl: 1, nr: 3, label: 'Fast'},
];

const getBinarySteps = (min: number, max: number): number[] => {
  const steps: number[] = [];
  let current = min;
  while (current <= max) {
    steps.push(current);
    current *= 2;
  }
  return steps;
};

const BENCHMARK_PARAMS_METADATA = {
  pp: {
    validation: {min: 64, max: 4096},
    descriptionKey:
      'Number of prompt processing tokens (max: physical batch size)',
    steps: getBinarySteps(64, 4096),
  },
  tg: {
    validation: {min: 32, max: 2048},
    descriptionKey: 'Number of text generation tokens',
    steps: getBinarySteps(32, 2048),
  },
  pl: {
    validation: {min: 1, max: 4},
    descriptionKey: 'Pipeline parallel size',
    steps: [1, 2, 3, 4],
  },
  nr: {
    validation: {min: 1, max: 10},
    descriptionKey: 'Number of repetitions',
    steps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
};

export const BenchmarkScreen: React.FC = observer(() => {
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<BenchmarkConfig>(
    DEFAULT_CONFIGS[0],
  );
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showAdvancedDialog, setShowAdvancedDialog] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [pendingDeleteTimestamp, setPendingDeleteTimestamp] = useState<
    string | null
  >(null);
  const [deleteAllConfirmVisible, setDeleteAllConfirmVisible] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [pendingShareResult, setPendingShareResult] =
    useState<BenchmarkResult | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GPU layer sweep state
  const [sweepRunning, setSweepRunning] = useState(false);
  const [sweepRows, setSweepRows] = useState<SweepCellResult[]>([]);
  const [sweepProgress, setSweepProgress] = useState<SweepProgress | null>(null);
  const [sweepError, setSweepError] = useState<string | null>(null);
  const [sweepOutcome, setSweepOutcome] = useState<SweepOutcome | null>(null);

  const theme = useTheme();
  const styles = createStyles(theme);
  const l10n = useContext(L10nContext);

  const handleSliderChange = (name: string, value: number) => {
    setSelectedConfig(prev => ({
      ...prev,
      [name]: value,
      label: 'Custom',
    }));
  };

  const handleModelSelect = async (model: Model) => {
    setShowModelMenu(false);
    if (model.id !== modelStore.activeModelId) {
      try {
        await modelStore.selectModel(model);
        setSelectedModel(model);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Model initialization error:', error);
        }
      }
    } else {
      setSelectedModel(model);
    }
  };

  const trackPeakMemoryUsage = async () => {
    try {
      const total = await RNDeviceInfo.getTotalMemory();
      const used = await RNDeviceInfo.getUsedMemory();
      const percentage = (used / total) * 100;
      return {total, used, percentage};
    } catch (error) {
      console.error('Failed to fetch memory stats:', error);
      return null;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const stopBenchmark = async () => {
    if (modelStore.context) {
      try {
        // TODO: This is not working for bench.
        await modelStore.context.stopCompletion();
      } catch (error) {
        console.error('Error stopping benchmark:', error);
      }
    }
  };

  const runBenchmark = async () => {
    if (!modelStore.context || !modelStore.activeModel) {
      return;
    }

    setIsRunning(true);
    setRunError(false);
    let peakMemoryUsage: NonNullable<
      BenchmarkResult['peakMemoryUsage']
    > | null = null;
    let memoryCheckInterval: ReturnType<typeof setInterval> | undefined;
    const startTime = Date.now();

    try {
      // Start memory tracking
      memoryCheckInterval = setInterval(async () => {
        const currentUsage = await trackPeakMemoryUsage();
        if (
          currentUsage &&
          (!peakMemoryUsage ||
            currentUsage.percentage > peakMemoryUsage.percentage)
        ) {
          peakMemoryUsage = currentUsage;
        }
      }, 1000);

      const {speedPp: ppAvg, speedTg: tgAvg} = await modelStore.context.bench(
        selectedConfig.pp,
        selectedConfig.tg,
        selectedConfig.pl,
        selectedConfig.nr,
      );
      const modelDesc = modelStore.context.model.desc;
      const modelSize = modelStore.context.model.size;
      const modelNParams = modelStore.context.model.nParams;

      const wallTimeMs = Date.now() - startTime;

      const result: BenchmarkResult = {
        config: selectedConfig,
        modelDesc,
        modelSize,
        modelNParams,
        ppAvg,
        ppStd: 0,
        tgAvg,
        tgStd: 0,
        timestamp: new Date().toISOString(),
        modelId: modelStore.activeModel.id,
        modelName: modelStore.activeModel.name,
        oid: modelStore.activeModel.hfModelFile?.oid,
        rfilename: modelStore.activeModel.hfModelFile?.rfilename,
        filename: modelStore.activeModel.filename,
        peakMemoryUsage: peakMemoryUsage || undefined,
        wallTimeMs,
        uuid: uuidv4(),
        initSettings: modelStore.activeContextSettings,
      };

      benchmarkStore.addResult(result);
    } catch (error) {
      setRunError(true);
      if (error instanceof Error) {
        console.error('Benchmark error:', error);
      }
    } finally {
      clearInterval(memoryCheckInterval);
      setIsRunning(false);
    }
  };

  const handlePresetSelect = (config: BenchmarkConfig) => {
    setSelectedConfig(config);
  };

  /**
   * Sweep `n_gpu_layers` across a fixed ladder and report pp/tg per step.
   *
   * Unlike `runBenchmark`, this cannot reuse the already-loaded context: the
   * layer count is an init-time parameter, so every step has to release, re-init
   * and bench. That also means the model ends up unloaded afterwards, hence the
   * restore call in `finally`.
   */
  const runSweep = async () => {
    const model = modelStore.activeModel;
    if (!model || sweepRunning || isRunning) {
      return;
    }
    setSweepRunning(true);
    setSweepError(null);
    setSweepRows([]);
    setSweepOutcome(null);
    setSweepProgress(null);
    try {
      const outcome = await runGpuLayerSweep({
        model,
        bench: {
          pp: selectedConfig.pp,
          tg: selectedConfig.tg,
          pl: selectedConfig.pl,
          nr: selectedConfig.nr,
        },
        onProgress: setSweepProgress,
      });
      setSweepRows(outcome.rows);
      setSweepOutcome(outcome);
    } catch (error) {
      setSweepError(error instanceof Error ? error.message : String(error));
    } finally {
      setSweepRunning(false);
      setSweepProgress(null);
      try {
        await modelStore.initContext(model);
      } catch (reloadError) {
        console.warn('[sweep] failed to restore context:', reloadError);
      }
    }
  };

  const exportSweepCsv = async () => {
    if (sweepRows.length === 0) {
      return;
    }
    const header = [
      'n_gpu_layers',
      'ok',
      'pp_tps',
      'tg_tps',
      'init_ms',
      'wall_ms',
      'peak_mem_mb',
      'android_lib',
      'devices',
      'gpu',
      'reported_gpu_layers',
      'error',
    ];
    const escape = (value: unknown): string => {
      const text = value === undefined || value === null ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const lines = [header.join(',')];
    for (const row of sweepRows) {
      lines.push(
        [
          row.layers,
          row.ok ? 'yes' : 'no',
          row.speedPp?.toFixed(2) ?? '',
          row.speedTg?.toFixed(2) ?? '',
          row.initMs ?? '',
          row.wallMs ?? '',
          row.peakMemoryMb ?? '',
          row.androidLib ?? '',
          (row.devices ?? []).join('|'),
          row.gpu ?? '',
          row.reportedGpuLayers ?? '',
          row.error ?? '',
        ]
          .map(escape)
          .join(','),
      );
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `gpu-layer-sweep-${stamp}.csv`;
    const path = `${RNFS.CachesDirectoryPath}/${filename}`;
    await RNFS.writeFile(path, lines.join('\n'), 'utf8');
    await Share.open({
      url: `file://${path}`,
      title: filename,
      type: 'text/csv',
      failOnCancel: false,
    });
  };

  const handleDeleteResult = (timestamp: string) => {
    setPendingDeleteTimestamp(timestamp);
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteTimestamp) {
      benchmarkStore.removeResult(pendingDeleteTimestamp);
    }
    setDeleteConfirmVisible(false);
    setPendingDeleteTimestamp(null);
  };

  const handleDeleteAll = () => {
    setDeleteAllConfirmVisible(true);
  };

  const handleConfirmDeleteAll = () => {
    benchmarkStore.clearResults();
    setDeleteAllConfirmVisible(false);
  };

  const handleDeviceInfo = useCallback((info: DeviceInfo) => {
    setDeviceInfo(info);
  }, []);

  const handleShareResult = async (result: BenchmarkResult) => {
    if (!deviceInfo) {
      throw new Error('Device information not available');
    }
    if (result.submitted) {
      throw new Error('This benchmark has already been submitted');
    }
    try {
      const response = await submitBenchmark(deviceInfo, result);
      console.log('Benchmark submitted successfully:', response);
      benchmarkStore.markAsSubmitted(result.uuid);
    } catch (error) {
      console.error('Failed to submit benchmark:', error);
      throw error;
    }
  };

  const handleSharePress = async (result: BenchmarkResult) => {
    if (!uiStore.benchmarkShareDialog.shouldShow) {
      await handleShareResult(result);
      return;
    }
    setPendingShareResult(result);
    setShowShareDialog(true);
  };

  const handleConfirmShare = async () => {
    if (dontShowAgain) {
      uiStore.setBenchmarkShareDialogPreference(false);
    }
    setIsSubmitting(true);
    try {
      if (pendingShareResult) {
        await handleShareResult(pendingShareResult);
      }
      setShowShareDialog(false);
      setPendingShareResult(null);
    } catch (error) {
      setShareError(
        error instanceof Error ? error.message : 'Failed to share benchmark',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMaxPPValue = () => {
    if (!modelStore.activeContextSettings) {
      return BENCHMARK_PARAMS_METADATA.pp.validation.max;
    }
    return Math.min(
      modelStore.activeContextSettings.n_ubatch,
      BENCHMARK_PARAMS_METADATA.pp.validation.max,
    );
  };

  const localModels = modelStore.availableModels.filter(
    m => m.origin !== ModelOrigin.REMOTE,
  );

  const renderModelSelector = () => (
    <Menu
      visible={showModelMenu}
      onDismiss={() => setShowModelMenu(false)}
      anchorPosition="bottom"
      selectable
      anchor={
        <Button
          mode="outlined"
          onPress={() => setShowModelMenu(true)}
          contentStyle={styles.modelSelectorContent}
          icon={({color}) => (
            <Icon source="chevron-down" size={24} color={color} />
          )}>
          {selectedModel?.name ||
            modelStore.activeModel?.name ||
            l10n.benchmark.modelSelector.prompt}
        </Button>
      }>
      {localModels.length === 0 ? (
        <Menu.Item
          key="no-models"
          label={l10n.benchmark.modelSelector.noModels}
          disabled
        />
      ) : (
        localModels.map(model => (
          <Menu.Item
            key={model.id}
            onPress={() => handleModelSelect(model)}
            label={model.name}
            leadingIcon={
              model.id === modelStore.activeModelId ? 'check' : undefined
            }
          />
        ))
      )}
    </Menu>
  );

  const renderSlider = ({
    name,
    testId,
  }: {
    name: keyof typeof BENCHMARK_PARAMS_METADATA;
    testId?: string;
  }) => {
    const metadata = BENCHMARK_PARAMS_METADATA[name];
    let steps = metadata.steps;

    if (name === 'pp') {
      const maxValue = getMaxPPValue();
      steps = steps.filter(step => step <= maxValue);
    }

    const stepIndex = steps.indexOf(selectedConfig[name]);

    return (
      <View style={styles.settingItem}>
        <Text variant="labelSmall" style={styles.settingLabel}>
          {name.toUpperCase()}
        </Text>
        <Slider
          testID={testId ?? `${name}-slider`}
          style={styles.slider}
          minimumValue={0}
          maximumValue={steps.length - 1}
          step={1}
          value={stepIndex}
          onValueChange={index => {
            const value = steps[Math.round(index)];
            handleSliderChange(name, value);
          }}
          thumbTintColor={theme.colors.primary}
          minimumTrackTintColor={theme.colors.primary}
        />
        <View style={styles.sliderDescriptionContainer}>
          <Text style={styles.description}>
            {metadata.descriptionKey}
            {name === 'pp' && modelStore.activeContextSettings && (
              <Text style={styles.maxValueHint}>
                {' '}
                {t(l10n.benchmark.messages.modelMaxValue, {
                  maxValue: getMaxPPValue().toString(),
                })}
              </Text>
            )}
          </Text>
          <Text style={styles.settingValue}>{selectedConfig[name]}</Text>
        </View>
      </View>
    );
  };

  const renderAdvancedSettings = () => (
    <Dialog
      testID="advanced-settings-dialog"
      visible={showAdvancedDialog}
      onDismiss={() => setShowAdvancedDialog(false)}
      title={l10n.benchmark.dialogs.advancedSettings.title}
      scrollable
      actions={[
        {
          label: l10n.benchmark.buttons.done,
          onPress: () => setShowAdvancedDialog(false),
        },
      ]}>
      <View>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {l10n.benchmark.dialogs.advancedSettings.testProfile}
        </Text>
        <View style={styles.presetContainer}>
          {DEFAULT_CONFIGS.map((config, index) => (
            <Button
              key={index}
              mode={selectedConfig === config ? 'contained' : 'outlined'}
              onPress={() => handlePresetSelect(config)}
              style={styles.presetButton}>
              {config.label}
            </Button>
          ))}
        </View>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          {l10n.benchmark.dialogs.advancedSettings.customParameters}
        </Text>
        <Text variant="bodySmall" style={styles.advancedDescription}>
          {l10n.benchmark.dialogs.advancedSettings.description}
        </Text>
        <View style={styles.slidersContainer}>
          {renderSlider({name: 'pp'})}
          {renderSlider({name: 'tg'})}
          {renderSlider({name: 'nr'})}
        </View>
      </View>
    </Dialog>
  );

  const renderWarningMessage = () => (
    <View style={styles.warningContainer}>
      <Text variant="bodySmall" style={styles.warningText}>
        {l10n.benchmark.messages.testWarning}
      </Text>
    </View>
  );

  const renderShareDialog = () => (
    <Dialog
      testID="share-benchmark-dialog"
      visible={showShareDialog}
      onDismiss={() => {
        setShowShareDialog(false);
        setPendingShareResult(null);
      }}
      title={l10n.benchmark.dialogs.shareResults.title}
      scrollable
      actions={[
        {
          testID: 'share-benchmark-dialog-cancel-button',
          label: l10n.benchmark.buttons.cancel,
          onPress: () => {
            setShowShareDialog(false);
            setPendingShareResult(null);
            setShareError(null);
          },
          disabled: isSubmitting,
        },
        {
          testID: 'share-benchmark-dialog-confirm-button',
          label: isSubmitting
            ? l10n.benchmark.buttons.sharing
            : l10n.benchmark.buttons.share,
          onPress: handleConfirmShare,
          mode: 'contained',
          loading: isSubmitting,
          disabled: isSubmitting,
        },
      ]}>
      <Text variant="bodyMedium" style={styles.dialogSection}>
        {l10n.benchmark.dialogs.shareResults.sharedDataTitle}
      </Text>
      <View style={styles.dialogList}>
        <Text variant="bodyMedium">
          {l10n.benchmark.dialogs.shareResults.deviceAndModelInfo}
        </Text>
        <Text variant="bodyMedium">
          {l10n.benchmark.dialogs.shareResults.performanceMetrics}
        </Text>
      </View>

      <Button
        testID="share-benchmark-dialog-view-raw-data-button"
        mode="text"
        onPress={() => setShowDetails(!showDetails)}
        icon={showDetails ? 'chevron-up' : 'chevron-down'}
        style={styles.detailsButton}>
        {showDetails
          ? l10n.benchmark.buttons.hideRawData
          : l10n.benchmark.buttons.viewRawData}
      </Button>

      {showDetails && pendingShareResult && deviceInfo && (
        <View
          testID="share-benchmark-dialog-raw-data-container"
          style={styles.detailsContainer}>
          <Text variant="bodySmall" style={styles.codeBlock}>
            {JSON.stringify(
              {
                deviceInfo,
                benchmark: pendingShareResult,
              },
              null,
              2,
            )}
          </Text>
        </View>
      )}

      {shareError && <Text style={styles.errorText}>{shareError}</Text>}

      <View style={styles.checkboxContainer}>
        <Checkbox
          testID="dont-show-again-checkbox"
          checked={dontShowAgain}
          onPress={() => setDontShowAgain(!dontShowAgain)}
        />
        <Text
          variant="bodySmall"
          style={styles.checkboxLabel}
          onPress={() => setDontShowAgain(!dontShowAgain)}>
          {l10n.benchmark.dialogs.shareResults.dontShowAgain}
        </Text>
      </View>
    </Dialog>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <Card elevation={0} style={styles.card}>
          <Card.Content>
            <DeviceInfoCard onDeviceInfo={handleDeviceInfo} />
            {renderModelSelector()}

            {modelStore.loadingModel ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  testID="loading-indicator-model-init"
                  size="large"
                />
                <Text style={styles.loadingText}>
                  {l10n.benchmark.messages.initializingModel}
                </Text>
              </View>
            ) : (
              <>
                {!modelStore.context &&
                !sweepRunning &&
                sweepRows.length === 0 ? (
                  <Text style={styles.warning}>
                    {l10n.benchmark.messages.pleaseSelectModel}
                  </Text>
                ) : (
                  <>
                    <Button
                      testID="advanced-settings-button"
                      mode="text"
                      onPress={() => setShowAdvancedDialog(true)}
                      icon="tune"
                      style={styles.advancedButton}>
                      {l10n.benchmark.buttons.advancedSettings}
                    </Button>

                    {!isRunning && renderWarningMessage()}

                    <Button
                      testID="start-test-button"
                      mode="contained"
                      onPress={runBenchmark}
                      disabled={isRunning || sweepRunning}
                      style={styles.button}>
                      {isRunning
                        ? l10n.benchmark.buttons.runningTest
                        : l10n.benchmark.buttons.startTest}
                    </Button>

                    {/* GPU layer sweep — re-inits the context per step, so it
                        is a separate action from the single-context test. */}
                    <Button
                      testID="gpu-layer-sweep-button"
                      mode="outlined"
                      icon="chart-line"
                      onPress={runSweep}
                      disabled={isRunning || sweepRunning}
                      style={styles.button}>
                      {sweepRunning
                        ? l10n.benchmark.sweep.running
                        : l10n.benchmark.sweep.start}
                    </Button>

                    {sweepRunning && (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator
                          testID="loading-indicator-sweep"
                          size="large"
                        />
                        <Text
                          testID="sweep-progress-text"
                          style={styles.warningText}>
                          {sweepProgress
                            ? t(l10n.benchmark.sweep.progress, {
                                index: String(sweepProgress.index),
                                total: String(sweepProgress.total),
                                layers: String(sweepProgress.layers),
                                phase: sweepProgress.phase,
                              })
                            : l10n.benchmark.sweep.preparing}
                        </Text>
                      </View>
                    )}

                    {!sweepRunning && (
                      <Text variant="labelSmall" style={styles.sweepTip}>
                        {l10n.benchmark.sweep.tip}
                      </Text>
                    )}

                    {sweepError && (
                      <Text testID="sweep-error" style={styles.errorText}>
                        {sweepError}
                      </Text>
                    )}

                    {sweepRows.length > 0 && (
                      <View testID="sweep-results" style={styles.resultsCard}>
                        <View style={styles.resultsHeader}>
                          <Text variant="titleSmall">
                            {l10n.benchmark.sweep.resultsTitle}
                          </Text>
                          <Button
                            testID="sweep-export-button"
                            mode="text"
                            compact
                            icon="share-variant"
                            onPress={exportSweepCsv}>
                            {l10n.benchmark.sweep.exportCsv}
                          </Button>
                        </View>

                        {sweepOutcome && !sweepRunning && (
                          <Text variant="bodySmall" style={styles.sweepVerdict}>
                            {sweepOutcome.allFailed
                              ? l10n.benchmark.sweep.verdictFailed
                              : sweepOutcome.bestLayers === 0 ||
                                sweepOutcome.baselineSpeedTg ===
                                  sweepOutcome.bestSpeedTg
                              ? t(l10n.benchmark.sweep.verdictCpuBest, {
                                  speed: (sweepOutcome.bestSpeedTg ?? 0).toFixed(
                                    2,
                                  ),
                                })
                              : t(l10n.benchmark.sweep.verdictBest, {
                                  layers: String(sweepOutcome.bestLayers ?? 0),
                                  speed: (sweepOutcome.bestSpeedTg ?? 0).toFixed(
                                    2,
                                  ),
                                  baseline: (
                                    sweepOutcome.baselineSpeedTg ?? 0
                                  ).toFixed(2),
                                })}
                          </Text>
                        )}

                        <View style={[styles.sweepRow, styles.sweepHeaderRow]}>
                          <Text style={[styles.sweepCell, styles.sweepCellWide]}>
                            {l10n.benchmark.sweep.colLayers}
                          </Text>
                          <Text style={styles.sweepCell}>
                            {l10n.benchmark.sweep.colPp}
                          </Text>
                          <Text style={styles.sweepCell}>
                            {l10n.benchmark.sweep.colTg}
                          </Text>
                          <Text style={styles.sweepCell}>
                            {l10n.benchmark.sweep.colBackend}
                          </Text>
                        </View>

                        {sweepRows.map(row => (
                          <View key={row.layers}>
                            <View style={styles.sweepRow}>
                              <Text
                                style={[styles.sweepCell, styles.sweepCellWide]}>
                                {row.layers}
                              </Text>
                              <Text style={styles.sweepCell}>
                                {row.ok ? row.speedPp?.toFixed(2) ?? '—' : '—'}
                              </Text>
                              <Text style={styles.sweepCell}>
                                {row.ok ? row.speedTg?.toFixed(2) ?? '—' : '—'}
                              </Text>
                              <Text style={styles.sweepCell}>
                                {row.ok
                                  ? row.androidLib?.includes('opencl')
                                    ? 'OpenCL'
                                    : 'CPU'
                                  : '×'}
                              </Text>
                            </View>
                            <Text variant="labelSmall" style={styles.sweepDetail}>
                              {[
                                row.androidLib,
                                (row.devices ?? []).join(', '),
                                row.peakMemoryMb
                                  ? `${row.peakMemoryMb} MB`
                                  : undefined,
                                row.error,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {runError && !isRunning && (
                      <Text
                        testID="benchmark-run-error"
                        style={styles.errorText}
                        accessibilityRole="alert"
                        accessibilityLiveRegion="polite">
                        {l10n.benchmark.messages.testFailed}
                      </Text>
                    )}

                    {isRunning && (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator
                          testID="loading-indicator-benchmark"
                          size="large"
                        />
                        <Text style={styles.warningText}>
                          {l10n.benchmark.messages.keepScreenOpen}
                        </Text>
                      </View>
                    )}

                    {renderAdvancedSettings()}
                  </>
                )}
              </>
            )}

            {benchmarkStore.results.length > 0 && (
              <View style={styles.resultsCard}>
                <View style={styles.resultsHeader}>
                  <Text variant="titleSmall">
                    {l10n.benchmark.sections.testResults}
                  </Text>
                  <Button
                    testID="clear-all-button"
                    mode="text"
                    onPress={handleDeleteAll}
                    icon="delete"
                    compact>
                    {l10n.benchmark.buttons.clearAll}
                  </Button>
                </View>
                {benchmarkStore.results.map((result, index) => (
                  <View key={index} style={styles.resultItem}>
                    <BenchResultCard
                      result={result}
                      onDelete={handleDeleteResult}
                      onShare={handleSharePress}
                    />
                  </View>
                ))}
              </View>
            )}

            <Dialog
              visible={deleteConfirmVisible}
              onDismiss={() => setDeleteConfirmVisible(false)}
              title={l10n.benchmark.dialogs.deleteResult.title}
              actions={[
                {
                  label: l10n.benchmark.buttons.cancel,
                  onPress: () => setDeleteConfirmVisible(false),
                },
                {
                  label: l10n.benchmark.buttons.delete,
                  onPress: handleConfirmDelete,
                },
              ]}>
              <Text>{l10n.benchmark.dialogs.deleteResult.message}</Text>
            </Dialog>

            <Dialog
              testID="clear-all-dialog"
              visible={deleteAllConfirmVisible}
              onDismiss={() => setDeleteAllConfirmVisible(false)}
              title={l10n.benchmark.dialogs.clearAllResults.title}
              actions={[
                {
                  testID: 'clear-all-dialog-cancel-button',
                  label: l10n.benchmark.buttons.cancel,
                  onPress: () => setDeleteAllConfirmVisible(false),
                },
                {
                  testID: 'clear-all-dialog-confirm-button',
                  label: l10n.benchmark.buttons.clearAll,
                  onPress: handleConfirmDeleteAll,
                },
              ]}>
              <Text>{l10n.benchmark.dialogs.clearAllResults.message}</Text>
            </Dialog>

            {renderShareDialog()}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
});
