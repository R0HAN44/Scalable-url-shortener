import axios from "axios";

const KGS_URL = process.env.KGS_URL || "http://kgs:4000";

export async function getShortCode(): Promise<string> {
  const res = await axios.get(`${KGS_URL}/next-key`, {
    timeout: 500,
  });

  return res.data.key;
}
