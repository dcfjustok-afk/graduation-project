import { listAlerts } from "../repositories/alertRepository";

export async function getAlerts() {
  return listAlerts();
}