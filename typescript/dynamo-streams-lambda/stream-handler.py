def handler(event, context):
    for record in event["Records"]:
        if "NewImage" in record["dynamodb"]:
            print("New image {}".format(record["dynamodb"]["NewImage"]))
        if "OldImage" in record["dynamodb"]:
            print("Old image {}".format(record["dynamodb"]["OldImage"]))
    return "done"