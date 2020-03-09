export function getKubernetesTemplates(
    repo: any,
    name: string,
    containerPort: number,
    replicaNumber: number
) {
    return [
        {
            apiVersion: "apps/v1",
            kind: "Deployment",
            metadata: { name },
            spec: {
                replicas: replicaNumber,
                selector: { matchLabels: { app: name } },
                template: {
                    metadata: {
                        labels: { app: name }
                    },
                    spec: {
                        containers: [
                            {
                                name: name,
                                image: repo.imageUri,
                                ports: [{ containerPort }]
                            }
                        ]
                    }
                }
            }
        }
    ]
}