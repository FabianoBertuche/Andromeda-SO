import { Router } from "express";
import { ProviderController } from "./ProviderController";
console.log("Registering Model Center Routes...");
import { ModelCatalogController } from "./ModelCatalogController";
import { BenchmarkController } from "./BenchmarkController";
import { RouterMetricsController } from "./RouterMetricsController";

const router = Router();
const providerCtrl = new ProviderController();
const modelCtrl = new ModelCatalogController();
const benchmarkCtrl = new BenchmarkController();
const routerCtrl = new RouterMetricsController();

// Providers
router.post("/providers", providerCtrl.register.bind(providerCtrl));
router.get("/providers", providerCtrl.list.bind(providerCtrl));
router.post("/providers/:id/sync", providerCtrl.syncModels.bind(providerCtrl));
router.post("/providers/:id/pull", providerCtrl.pullModel.bind(providerCtrl));
router.delete("/providers/:id/models/:modelName", providerCtrl.deleteModel.bind(providerCtrl));
router.get("/providers/:id/ps", providerCtrl.listRunningModels.bind(providerCtrl));
router.get("/providers/:id/models/:modelName", providerCtrl.showModelInfo.bind(providerCtrl));
router.post("/providers/:id/models", providerCtrl.createModel.bind(providerCtrl));
router.post("/providers/:id/copy", providerCtrl.copyModel.bind(providerCtrl));

// Models
router.get("/models", modelCtrl.list.bind(modelCtrl));
router.get("/models/:id", modelCtrl.get.bind(modelCtrl));

// Benchmarks
router.post("/benchmarks/run", benchmarkCtrl.run.bind(benchmarkCtrl));
router.get("/models/:modelId/benchmarks", benchmarkCtrl.list.bind(benchmarkCtrl));

// Router Intelligence
router.get("/router/decisions", routerCtrl.getDecisions.bind(routerCtrl));
router.post("/router/simulate", routerCtrl.simulateRoute.bind(routerCtrl));

export default router;
