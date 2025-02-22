import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription
} from 'n8n-workflow';

import { fetchModels } from './resources/models';





export class OpenWebUi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OpenWebUI',
		name: 'openWebUi',
		icon: 'file:openwebui.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume OpenWebUI API',
		defaults: {
			name: 'OpenWebUi',
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
				displayName: 'Feature',
				name: 'feature',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Chat',
						value: 'chat',
					},
					{
						name: 'Knowledge Base',
						value: 'knowledgeBase',
					},
					{
						name: 'Model',
						value: 'model',
					},
					{
						name: 'Tool',
						value: 'tools',
					},
				],
				default: 'chat',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						feature: [
							'chat',
						],
					},
				},
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
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						feature: [
							'knowledgeBase',
						],
					},
				},
				options: [
					{
						name: 'Add Document',
						value: 'addDocument',
						description: 'Add a document to the knowledge base',
						action: 'Add a document to the knowledge base',
					},
					{
						name: 'Query',
						value: 'query',
						description: 'Query the knowledge base',
						action: 'Query the knowledge base',
					},
				],
				default: 'addDocument',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						feature: [
							'tools',
						],
					},
				},
				options: [
					{
						name: 'List',
						value: 'list',
						description: 'List available tools',
						action: 'List available tools',
					},
					{
						name: 'Execute',
						value: 'execute',
						description: 'Execute a tool',
						action: 'Execute a tool',
					},
				],
				default: 'list',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						feature: [
							'models',
						],
					},
				},
				options: [
					{
						name: 'List',
						value: 'list',
						description: 'Get list of available models',
						action: 'Get list of available models',
						routing: {
							request: {
								method: 'GET',
								url: '/api/models',
							},
						},
					},
				],
				default: 'list',
			},

			// Chat Parameters
			{
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				required: true,
				default: '',
				displayOptions: {
					show: {
						feature: ['chat'],
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
						feature: ['chat'],
						operation: ['sendMessage'],
					},
				},
				description: 'Message to send',
				typeOptions: {
					rows: 4,
				},
			},

			// Knowledge Base Parameters
			{
				displayName: 'Document',
				name: 'document',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						feature: ['knowledgeBase'],
						operation: ['addDocument'],
					},
				},
				description: 'Document content to add',
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						feature: ['knowledgeBase'],
						operation: ['query'],
					},
				},
				description: 'Query to search for',
			},

			// Tools Parameters
			{
				displayName: 'Tool Name',
				name: 'toolName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						feature: ['tools'],
						operation: ['execute'],
					},
				},
				description: 'Name of the tool to execute',
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
		const feature = this.getNodeParameter('feature', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('openWebUiApi');

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;

				if (feature === 'chat') {
					if (operation === 'sendMessage') {
						const message = this.getNodeParameter('message', i) as string;
						const model = this.getNodeParameter('model', i) as string;
						responseData = await this.helpers.request({
							method: 'POST',
							url: `${credentials.apiUrl}/api/chat/completions`,
							headers: {
								'Accept': 'application/json',
								'Authorization': `Bearer ${credentials.jwtToken}`,
							},
							body: {
								model,
								messages: [
									{
										role: 'user',
										content: message,
									},
								],
							},
							json: true,
						});
					} else if (operation === 'getHistory') {
						responseData = await this.helpers.request({
							method: 'GET',
							url: `${credentials.apiUrl}/api/chat/history`,
							json: true,
						});
					}
				} else if (feature === 'knowledgeBase') {
					if (operation === 'addDocument') {
						const document = this.getNodeParameter('document', i) as string;
						responseData = await this.helpers.request({
							method: 'POST',
							url: `${credentials.apiUrl}/api/kb/add`,
							body: { content: document },
							json: true,
						});
					} else if (operation === 'query') {
						const query = this.getNodeParameter('query', i) as string;
						responseData = await this.helpers.request({
							method: 'POST',
							url: `${credentials.apiUrl}/api/kb/query`,
							body: { query },
							json: true,
						});
					}
				} else if (feature === 'tools') {
					if (operation === 'list') {
						responseData = await this.helpers.request({
							method: 'GET',
							url: `${credentials.apiUrl}/api/tools/list`,
							json: true,
						});
					} else if (operation === 'execute') {
						const toolName = this.getNodeParameter('toolName', i) as string;
						responseData = await this.helpers.request({
							method: 'POST',
							url: `${credentials.apiUrl}/api/tools/execute`,
							body: { tool: toolName },
							json: true,
						});
					}
				} else if (feature === 'model') {
					if (operation === 'list') {
						responseData = await this.helpers.request({
							method: 'GET',
							url: `${credentials.apiUrl}/api/models`,
							json: true,
						});
					}
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
