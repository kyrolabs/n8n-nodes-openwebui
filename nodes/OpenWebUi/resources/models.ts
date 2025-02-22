interface IModel {
	id: string;
	name: string;
	description?: string;
	capabilities?: string[];
}

interface IModelResponse {
	data: {
		id: string;
		name: string;
		description?: string;
		capabilities?: string[];
	}[];
}

export async function fetchModels(apiUrl: string, jwtToken: string): Promise<IModel[]> {
	try {
		const response = await fetch(`${apiUrl}/api/models`, {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'Authorization': `Bearer ${jwtToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.statusText}`);
		}

		const data = await response.json() as IModelResponse;
		return data.data.map(model => ({
			id: model.id,
			name: model.name,
			description: model.description,
			capabilities: model.capabilities,
		}));
	} catch (error) {
		console.error('Error fetching models:', error);
		throw error;
	}
}
