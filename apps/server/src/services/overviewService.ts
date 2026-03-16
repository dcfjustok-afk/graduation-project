import { getOverviewStats } from "../repositories/overviewRepository";

export async function getOverview() {
  return getOverviewStats();
}