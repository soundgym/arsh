import * as admin from "firebase-admin";
import ITaskConfig from "../interface/ITaskConfig";

export default async function fetchConfigs():Promise<ITaskConfig[]> {
    const snapshot = await admin.database().ref('taskConfigs').once('value');
    return Object.values(snapshot.val() || {});
}
