import { LosslessAPI } from "@side-a/shared/api";
import instances from "@/instances.json";

const settings = {
  getInstances: async () => instances as string[],
};

export const api = new LosslessAPI(settings);
