const Batch = require("aws-sdk").Batch;

const batch = new Batch({
    region: process.env.REGION
});

async function handler(event, context, callback) {
    try {
        const jobName = `job_${Date.now()}`;
        await batch.submitJob({
            jobDefinition: process.env.JOB_DEFINITION,
            jobQueue: process.env.JOB_QUEUE,
            jobName
        }).promise();
        console.log("Job submitted", jobName);
        callback(null, "done");
    } catch(err) {
        console.error(err);
        callback("Internal error");
    }
}

module.exports.handler = handler;