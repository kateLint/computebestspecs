import { HardwareProfile } from "../../lib/domain/hardware";
import { DEV_LAPTOP_16GB_FIXTURE } from "./dev-laptop-16gb";

export const DEV_LAPTOP_32GB_FIXTURE: HardwareProfile = {
  ...DEV_LAPTOP_16GB_FIXTURE,
  ram: {
    ...DEV_LAPTOP_16GB_FIXTURE.ram,
    totalGb: 32,
  },
};
