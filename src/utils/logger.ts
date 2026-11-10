/**
 * Runtime diagnostics logger.
 *
 * Purpose: make "did the app actually load the OpenCL variant and put layers
 * on the GPU?" answerable from the phone itself, without adb/logcat.
 *
 * What it captures:
 *  - Every llama.rn context init: the native library that was actually loaded
 *    (`context.androidLib`), the backend devices handed to the engine
 *    (`context.devices`), `context.gpu` / `reasonNoGPU`, and the params used
 *    (n_gpu_layers, devices, n_ctx, threads, flash attention).
 *  - ggml / llama.cpp native log lines (filtered: only backend / OpenCL /
 *    Adreno / device / error lines survive, so a token-by-token log never
 *    floods the buffer).
 *  - Benchmark rows and any thrown error with its stack.
 *
 * Export writes a plain-text report into the app cache dir and hands it to the
 * system share sheet, so the user can send it anywhere.
 */
import {Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import * as RNFS from '@dr.pogodin/react-native-fs';
import Share from 'react-native-share';

import {addNativeLogListener, toggleNativeLog} from 'llama.rn';

export type LogLevel = 'info' | 'warn' | 'error' | 'native';

export interface LogEntry {
  ts: string;
  level: LogLevel;
  scope: string;
  message: string;
}

/** Native lines we keep. Everything else is dropped to protect the buffer. */
const NATIVE_LINE_ALLOWLIST = [
  'opencl',
  'adreno',
  'backend',
  'device',
  'ggml_',
  'hexagon',
  'htp',
  'offload',
  'n_gpu_layers',
  'error',
  'fail',
  'warning',
  'not supported',
  'unsupported',
];

const MAX_ENTRIES = 900;
const MAX_NATIVE_LINES = 400;

class RuntimeLogger {
  private entries: LogEntry[] = [];
  private nativeLines: string[] = [];
  private nativeSubscription: {remove: () => void} | null = null;
  private nativeEnabled = false;
  /** Snapshot of the last successful context init, for the report header. */
  private lastInit: Record<string, unknown> | undefined;

  /** Idempotent. Safe to call on every app start. */
  attach = async (): Promise<void> => {
    this.log('app', `logger attached on ${Platform.OS}`, {
      osVersion: String(Platform.Version),
    });
    // Defer native capture: llama.rn installs its JSI bridge lazily, and
    // flipping native logging during the first render is the one moment where
    // that install can race with the UI thread.
    setTimeout(() => {
      this.startNativeCapture().catch(() => undefined);
    }, 800);
  };

  /**
   * Turn on llama.cpp's native log and keep only the lines that say anything
   * about which backend ran. Failure is non-fatal: on some builds native
   * logging is unavailable before the JSI module is installed.
   */
  startNativeCapture = async (): Promise<void> => {
    if (this.nativeEnabled) {
      return;
    }
    try {
      await toggleNativeLog(true);
      this.nativeSubscription = addNativeLogListener((level, text) => {
        const line = String(text ?? '');
        const lower = line.toLowerCase();
        if (!NATIVE_LINE_ALLOWLIST.some(token => lower.includes(token))) {
          return;
        }
        const stamped = `[${level}] ${line}`.slice(0, 400);
        this.nativeLines.push(stamped);
        if (this.nativeLines.length > MAX_NATIVE_LINES) {
          this.nativeLines.splice(0, this.nativeLines.length - MAX_NATIVE_LINES);
        }
      });
      this.nativeEnabled = true;
      this.log('logger', 'native llama.cpp log capture enabled');
    } catch (error) {
      this.log('logger', 'native log capture unavailable', this.errorInfo(error));
    }
  };

  stopNativeCapture = (): void => {
    this.nativeSubscription?.remove();
    this.nativeSubscription = null;
    if (this.nativeEnabled) {
      toggleNativeLog(false).catch(() => undefined);
      this.nativeEnabled = false;
    }
  };

  private errorInfo = (error: unknown): Record<string, unknown> => {
    if (error instanceof Error) {
      return {name: error.name, message: error.message, stack: error.stack};
    }
    return {raw: String(error)};
  };

  log = (
    scope: string,
    message: string,
    data?: Record<string, unknown>,
  ): void => {
    const ts = new Date().toISOString();
    let text = message;
    if (data) {
      try {
        text = `${message} ${JSON.stringify(data)}`;
      } catch {
        text = `${message} [unserializable data]`;
      }
    }
    this.entries.push({ts, level: 'info', scope, message: text.slice(0, 900)});
    this.trim();
  };

  warn = (
    scope: string,
    message: string,
    data?: Record<string, unknown>,
  ): void => {
    this.push('warn', scope, message, data);
  };

  error = (
    scope: string,
    message: string,
    data?: Record<string, unknown>,
  ): void => {
    this.push('error', scope, message, data);
  };

  private push = (
    level: LogLevel,
    scope: string,
    message: string,
    data?: Record<string, unknown>,
  ): void => {
    const ts = new Date().toISOString();
    let text = message;
    if (data) {
      try {
        text = `${message} ${JSON.stringify(data)}`;
      } catch {
        text = `${message} [unserializable data]`;
      }
    }
    this.entries.push({ts, level, scope, message: text.slice(0, 900)});
    this.trim();
  };

  private trim = (): void => {
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.splice(0, this.entries.length - MAX_ENTRIES);
    }
  };

  /**
   * Record what llama.rn actually resolved after `initLlama`. This is the
   * single most important record in the whole file: `androidLib` names the
   * native library variant that got loaded, so a `...hexagon_opencl` suffix
   * proves OpenCL is live, while `...dotprod_i8mm` proves it fell back to CPU.
   */
  recordContextInit = (payload: {
    modelName?: string;
    params?: Record<string, unknown>;
    androidLib?: string;
    devices?: string[];
    gpu?: boolean;
    reasonNoGPU?: string;
    systemInfo?: unknown;
    initMs?: number;
    backendDevices?: unknown;
  }): void => {
    const {androidLib, devices, gpu} = payload;
    this.lastInit = {
      ...payload.params,
      androidLib,
      devices,
      gpu,
    };

    const acceleration =
      androidLib && androidLib.includes('opencl') && devices && devices.length > 0
        ? 'OpenCL (GPU)'
        : devices && devices.some(d => d.startsWith('HTP'))
        ? 'Hexagon (NPU)'
        : 'CPU';

    this.log('llama:init', `context ready — acceleration=${acceleration}`, {
      model: payload.modelName,
      androidLib,
      devices,
      gpu,
      reasonNoGPU: payload.reasonNoGPU,
      initMs: payload.initMs,
      n_gpu_layers: payload.params?.n_gpu_layers,
      n_ctx: payload.params?.n_ctx,
      n_threads: payload.params?.n_threads,
      flash_attn_type: payload.params?.flash_attn_type,
      systemInfo: payload.systemInfo,
    });

    if (payload.backendDevices) {
      this.log('llama:backend-devices', 'registered backend devices', {
        devices: payload.backendDevices,
      });
    }
  };

  recordBench = (payload: Record<string, unknown>): void => {
    this.log('bench', 'bench result', payload);
  };

  recordError = (
    scope: string,
    message: string,
    error: unknown,
  ): void => {
    this.error(scope, message, this.errorInfo(error));
  };

  /**
   * Plain-text report for the share sheet. Header carries the device facts we
   * cannot read from inside the app's own log.
   */
  buildReport = async (): Promise<string> => {
    const lines: string[] = [];
    lines.push('PocketPal runtime diagnostics');
    lines.push(`generated: ${new Date().toISOString()}`);
    lines.push('');

    try {
      const [model, systemName, systemVersion, brand, totalMem, isEmulator] =
        await Promise.all([
          DeviceInfo.getModel(),
          DeviceInfo.getSystemName(),
          DeviceInfo.getSystemVersion(),
          DeviceInfo.getBrand(),
          DeviceInfo.getTotalMemory(),
          DeviceInfo.isEmulator(),
        ]);
      lines.push('# device');
      lines.push(`model: ${model}`);
      lines.push(`brand: ${brand}`);
      lines.push(`os: ${systemName} ${systemVersion} (${Platform.OS} ${Platform.Version})`);
      lines.push(`totalMemory: ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GiB`);
      lines.push(`emulator: ${isEmulator}`);
      lines.push('');
    } catch (error) {
      lines.push(`# device (unavailable: ${String(error)})`);
      lines.push('');
    }

    if (this.lastInit) {
      lines.push('# last successful context init');
      try {
        lines.push(JSON.stringify(this.lastInit, null, 2));
      } catch {
        lines.push('[unserializable]');
      }
      lines.push('');
    }

    if (this.nativeLines.length > 0) {
      lines.push('# native llama.cpp lines (filtered)');
      lines.push(...this.nativeLines);
      lines.push('');
    }

    lines.push('# app log (oldest first)');
    for (const entry of this.entries) {
      lines.push(`${entry.ts} [${entry.level}] ${entry.scope}: ${entry.message}`);
    }

    lines.push('');
    lines.push(
      '# how to read this',
      '  acceleration=OpenCL (GPU) + androidLib *hexagon_opencl  => GPU path is live',
      '  acceleration=CPU + androidLib *dotprod_i8mm             => fell back to CPU',
    );

    return lines.join('\n');
  };

  export = async (): Promise<string> => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `pocketpal-diagnostics-${stamp}.txt`;
    const report = await this.buildReport();
    const tempPath = `${RNFS.CachesDirectoryPath}/${filename}`;
    await RNFS.writeFile(tempPath, report, 'utf8');
    await Share.open({
      url: `file://${tempPath}`,
      title: filename,
      type: 'text/plain',
      failOnCancel: false,
    });
    this.log('logger', `diagnostics exported: ${filename}`);
    return tempPath;
  };

  /** Kept for the settings screen: cheap way to show a live line count. */
  get counts(): {events: number; nativeLines: number} {
    return {events: this.entries.length, nativeLines: this.nativeLines.length};
  }

  clear = (): void => {
    this.entries = [];
    this.nativeLines = [];
    this.lastInit = undefined;
  };
}

export const runtimeLogger = new RuntimeLogger();
