import { layerBus } from "../../src/components/layer/bus";
import { createLayerScene } from "../../src/components/layer/scene";
import { LAYOUTS } from "../../src/components/layer/scene/layout";

(window as unknown as { __lab: unknown }).__lab = { createLayerScene, layerBus, LAYOUTS };
