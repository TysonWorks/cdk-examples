export async function handler(event, context, callback) {
    try {
        console.log("Event:", JSON.stringify(event));
        return callback(null, "Hello, function URL.");
    } catch(err) {
        console.error("Error", err);
        return callback("Error");
    }
}