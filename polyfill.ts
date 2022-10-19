(window as any).global = window;
import { Buffer } from "buffer";
global.Buffer = Buffer;
global.process = {
  env: { DEBUG: undefined },
  version: "",
  nextTick: require("next-tick"),
} as any;
