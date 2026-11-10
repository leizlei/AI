/**
 * GPU layer sweep.
 *
 * Measures the same prompt-processing / text-generation bench at several
 * `n_gpu_layers` values so the user can see where the sweet spot is on their
 * own phone, instead of guessing.
 *
 * Context lifecycle (deliberately identical to the automation bench runner):
 *  - `modelStore.enterBenchmarkMode()` takes exclusive ownership and releases
 *    whatever the rest of the app had loaded, so no stale LlamaContext competes
 *    for memory.
 *  - Every cell creates its own `LlamaContext` via `initLlama`, never touching
 *    `modelStore.context`.
 *  - Every cell is released before the next one starts. A layer count of 99
 *    on a 12 GiB shared-memory phone is a plausible OOM, so holding two contexts
 *    at once is not an option.
 */
import {Platform} from 'react-native';
import RNDeviceInfo from 'react-native-device-info';
import {initLlama} from 'llama.rn';

import {modelStore} from '../store';
import {getAvailableDevices} from '../utils/deviceSelection';
import {runtimeLogger} from '../utils/logger';
import type {Model} from '../utils/types';

export interface SweepCellResult {
  layers: number;
  ok: boolean;
  /** Prompt-processing tokens/s. */
  speedPp?: number;
  /** Text-generation tokens/s. */
  speedTg?: number;
  /** Prompt-processing wall time in ms. */
  tPpMs?: number;
  /** Text-generation wall time in ms. */
  tTgMs?: number;
  initMs?: number;
  wallMs?: number;
  peakMemoryMb?: number;
  totalMemoryMb?: number;
  /** Native library variant llama.rn actually loaded for this cell. */
  androidLib?: string;
  devices?: string[];
  gpu?: boolean;
  reasonNoGPU?: string;
  /** n_gpu_layers llama.cpp reports back from bench(), i.e. layers it honored. */
  reportedGpuLayers?: number;
  error?: string;
}

export interface SweepProgress {
  index: number;
  total: number;
  layers: number;
  phase: 'init' | 'bench' | 'done' | 'failed';
}

export interface SweepOutcome {
  rows: SweepCellResult[];
  gpuDeviceName?: string;
  cancelled: boolean;
  /** Quick verdict string (English; the screen localizes its own line). */
  verdict: string;
  bestLayers?: number;
  bestSpeedTg?: number;
  /** CPU-only baseline (layers = 0), when that cell ran successfully. */
  baselineSpeedTg?: number;
  allFailed: boolean;
}

export const DEFAULT_SWEEP_LAYERS = [0, 8, 16, 24, 33, 99];

const DEFAULT_SWEEP_BENCH = {pp: 512, tg: 128, pl: 1, nr: 3};

const readMemoryMb = async (): Promise<{
  usedMb?: number;
  totalMb?: number;
}> => {
  try {
    const [total, used] = await Promise.all([
      RNDeviceInfo.getTotalMemory(),
      RNDeviceInfo.getUsedMemory(),
    ]);
    return {
      usedMb: Math.round(used / 1024 / 1024),
      totalMb: Math.round(total / 1024 / 1024),
    };
  } catch {
    return {};
  }
};

/**
 * Run the sweep. `onProgress` fires around each cell so the screen can render
 * "3/6 · 16 layers · benching…".
 *
 * Returns a verdict that names the fastest cell, because the interesting
 * outcome for this device is usually "more layers is not better" — a Q4_K_M
 * model mostly stays on the CPU under ggml-opencl, so the GPU-side work adds
 * overhead without removing CPU work.
 */
export async function runGpuLayerSweep(args: {
  model: Model;
  layers?: number[];
  bench?: {pp: number; tg: number; pl: number; nr: number};
  onProgress?: (progress: SweepProgress) => void;
  isCancelled?: () => boolean;
}): Promise<SweepOutcome> {
  const layers = args.layers?.length ? args.layers : DEFAULT_SWEEP_LAYERS;
  const bench = args.bench ?? DEFAULT_SWEEP_BENCH;
  const rows: SweepCellResult[] = [];

  const filePath = await modelStore.getModelFullPath(args.model);
  if (!filePath) {
    throw new Error('Model file path is not available');
  }

  const backendDevices = await getAvailableDevices();
  const gpuDevice = backendDevices.find(d => d.type === 'gpu');
  if (!gpuDevice?.deviceName) {
    throw new Error(
      'No OpenCL GPU backend was registered. The app loaded a CPU-only native library, so layer offload cannot be measured.',
    );
  }

  const baseParams = await modelStore.getEffectiveContextInitParams(filePath);
  const memory = await readMemoryMb();

  runtimeLogger.log('sweep', 'starting GPU layer sweep', {
    model: args.model.name,
    layers,
    bench,
    gpuDevice: gpuDevice.deviceName,
    backendDevices,
  });

  await modelStore.enterBenchmarkMode();

  let cancelled = false;
  try {
    for (let i = 0; i < layers.length; i++) {
      const n = layers[i];
      if (args.isCancelled?.()) {
        cancelled = true;
        break;
      }

      const startedAt = Date.now();
      const row: SweepCellResult = {layers: n, ok: false};
      let ctx: Awaited<ReturnType<typeof initLlama>> | null = null;

      args.onProgress?.({index: i + 1, total: layers.length, layers: n, phase: 'init'});

      try {
        const initT0 = Date.now();
        ctx = await initLlama(
          {
            ...baseParams,
            model: filePath,
            // Pin the OpenCL device explicitly: the persisted settings may
            // still say CPU, and resolveDeviceSelection's CPU fallback would
            // silently zero out every cell of this sweep.
            devices: [gpuDevice.deviceName],
            n_gpu_layers: n,
            // ggml-opencl only supports flash attention off and an f16 KV
            // cache; a persisted 'on'/'auto' or a quantized cache type would
            // make every cell fail before it ever reaches bench().
            flash_attn_type: 'off',
            cache_type_k: 'f16',
            cache_type_v: 'f16',
            n_parallel: 1,
            use_progress_callback: true,
          },
          () => undefined,
        );
        row.initMs = Date.now() - initT0;
        row.androidLib = ctx.androidLib;
        row.devices = ctx.devices as unknown as string[];
        row.gpu = ctx.gpu;
        row.reasonNoGPU = ctx.reasonNoGPU;

        args.onProgress?.({index: i + 1, total: layers.length, layers: n, phase: 'bench'});

        const result = await ctx.bench(bench.pp, bench.tg, bench.pl, bench.nr);
        row.ok = true;
        row.speedPp = result.speedPp;
        row.speedTg = result.speedTg;
        row.tPpMs = result.tPp;
        row.tTgMs = result.tTg;
        row.reportedGpuLayers = result.nGpuLayers;
      } catch (error) {
        row.ok = false;
        row.error = error instanceof Error ? error.message : String(error);
        runtimeLogger.recordError('sweep', `cell n_gpu_layers=${n} failed`, error);
        args.onProgress?.({
          index: i + 1,
          total: layers.length,
          layers: n,
          phase: 'failed',
        });
      } finally {
        const releaseT0 = Date.now();
        try {
          await ctx?.release();
        } catch (releaseError) {
          runtimeLogger.recordError('sweep', 'context release failed', releaseError);
        }
        // Give the Adreno driver a beat to hand memory back before the next
        // init; without it the next cell can OOM on a phone with shared
        // memory and an already-fragmented GPU heap.
        if (Platform.OS === 'android') {
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
        row.wallMs = Date.now() - startedAt;
      }

      const afterRelease = await readMemoryMb();
      row.peakMemoryMb = afterRelease.usedMb ?? memory.usedMb;
      row.totalMemoryMb = afterRelease.totalMb ?? memory.totalMb;

      rows.push(row);
      runtimeLogger.recordBench({
        kind: 'gpu-layer-sweep',
        layers: n,
        ok: row.ok,
        speedPp: row.speedPp,
        speedTg: row.speedTg,
        initMs: row.initMs,
        wallMs: row.wallMs,
        androidLib: row.androidLib,
        devices: row.devices,
        reportedGpuLayers: row.reportedGpuLayers,
        error: row.error,
      });
      args.onProgress?.({index: i + 1, total: layers.length, layers: n, phase: 'done'});
    }
  } finally {
    modelStore.exitBenchmarkMode();
  }

  const successful = rows.filter(r => r.ok && r.speedTg !== undefined);
  const zero = successful.find(r => r.layers === 0);
  let verdict: string;
  let bestLayers: number | undefined;
  let bestSpeedTg: number | undefined;

  if (successful.length === 0) {
    verdict = 'All cells failed — no usable configuration.';
  } else {
    const best = successful.reduce((a, b) =>
      (b.speedTg ?? 0) > (a.speedTg ?? 0) ? b : a,
    );
    bestLayers = best.layers;
    bestSpeedTg = best.speedTg;
    verdict =
      zero && best.layers !== 0
        ? `Best: ${best.layers} layers at ${(best.speedTg ?? 0).toFixed(2)} tok/s (CPU-only baseline ${(zero.speedTg ?? 0).toFixed(2)} tok/s).`
        : zero
        ? `CPU-only (0 layers) is still the fastest at ${(zero.speedTg ?? 0).toFixed(2)} tok/s — offload costs more than it saves on this model.`
        : `Best: ${best.layers} layers at ${(best.speedTg ?? 0).toFixed(2)} tok/s.`;
  }

  runtimeLogger.log('sweep', 'GPU layer sweep finished', {verdict, cancelled});

  return {
    rows,
    gpuDeviceName: gpuDevice.deviceName,
    cancelled,
    verdict,
    bestLayers,
    bestSpeedTg,
    baselineSpeedTg: zero?.speedTg,
    allFailed: successful.length === 0,
  };
}
