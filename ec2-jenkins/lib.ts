import cheerio = require("cheerio");
import axios from "axios";

const bitnamiURL = "https://bitnami.com/stack/jenkins/cloud/aws/amis";

export async function getLatestJenkinsAMI(region: string): Promise<string> {
    try {
        const regionSelection = mapRegionSelector(region)
        const selector = `${regionSelection} > table > tbody > tr > td:nth-child(3) > span.clouds__amis__link > a`;
        const result = await axios.get(bitnamiURL);
        const $ = cheerio.load(result.data);
        const res = $(selector).text();
        return res;
    } catch(err) {
        console.error(err);
        return "error";
    }
}

function mapRegionSelector(region: string): string {
    switch(region) {
        case "us-west-1":
            return "#us-west-\\(n\\.-california\\)";
        case "us-west-2":
            return "#us-west-\\(oregon\\)";
        case "us-east-1":
            return "#us-east-\\(n\\.-virginia\\)";
        case "us-east-2":
            return "#us-east-\\(ohio\\)";
        case "ca-central-1":
            return "#canada-\\(central\\)";
        case "eu-central-1":
            return "#eu-\\(frankfurt\\)";
        case "eu-west-1":
            return "#eu-\\(ireland\\)";
        case "eu-west-2":
            return "#eu-\\(london\\)";
        case "eu-west-3":
            return "#eu-\\(paris\\)";
        case "eu-north-1":
            return "#eu-\\(stockholm\\)";
        case "ap-east-1":
            return "#asia-pacific-\\(hong-kong\\)";
        case "ap-southeast-1":
            return "#asia-pacific-\\(singapore\\)";
        case "ap-southeast-2":
            return "#asia-pacific-\\(sydney\\)";
        case "ap-south-1":
            return "#asia-pacific-\\(mumbai\\)";
        case "ap-northeast-1":
            return "#asia-pacific-\\(tokyo\\)";
        case "ap-northeast-2":
            return "#asia-pacific-\\(seoul\\)";
        case "sa-east-1": 
            return "#south-america-\\(sao-paulo\\)";
        case "me-south-1":
            return "#middle-east-\\(bahrain\\)";
        default:
            return "#us-west-\\(oregon\\)";
    }
}
