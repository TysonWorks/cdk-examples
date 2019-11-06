import cheerio = require("cheerio");
import axios from "axios";

const bitnamiURL = "https://bitnami.com/stack/jenkins/cloud/aws/amis";

export async function getLatestJenkinsAMI(): Promise<string> {
    try {
        // change selector according to correct aws region
        const selector = "#us-west-\\(n\\.-california\\) > table > tbody > tr > td:nth-child(3) > span.clouds__amis__link > a";
        const result = await axios.get(bitnamiURL);
        const $ = cheerio.load(result.data);
        const res = $(selector).text();
        return res;
    } catch(err) {
        console.log("error", err);
        return "error";
    }
}

