import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { fetchModels } from './resources/models';
import { makeRequest } from './resources/shared';

export class OpenWebUiChat implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OpenWebUI Chat',
		name: 'openWebUiChat',
		icon: 'file:openwebui-chat.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Use OpenWebUI Chat API',
		defaults: {
			name: 'OpenWebUI Chat',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'openWebUiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send a message to the chat',
						action: 'Send a message to the chat',
					},
					{
						name: 'Get History',
						value: 'getHistory',
						description: 'Get chat history',
						action: 'Get chat history',
					},
				],
				default: 'sendMessage',
			},
			{
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				description: 'Model to use for chat completion. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				typeOptions: {
					loadOptionsMethod: 'getModels',
				},
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				description: 'Message to send',
				typeOptions: {
					rows: 4,
				},
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions) {
				const credentials = await this.getCredentials('openWebUiApi');
				const models = await fetchModels(credentials.apiUrl as string, credentials.jwtToken as string);

				return models.map((model) => ({
					name: model.name,
					value: model.id,
					description: model.capabilities?.join(', ') || 'No capability information available',
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;

				if (operation === 'sendMessage') {
					const message = this.getNodeParameter('message', i) as string;
					const model = this.getNodeParameter('model', i) as string;

					responseData = await makeRequest.call(this, 'POST', '/api/chat/completions', {
						model,
						messages: [
							{
								role: 'user',
								content: message,
							},
						],
					});
				} else if (operation === 'getHistory') {
					responseData = await makeRequest.call(this, 'GET', '/api/chat/history');
				}

				returnData.push({
					json: responseData,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
