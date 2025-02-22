import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { makeRequest } from './resources/shared';

export class OpenWebUiRag implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OpenWebUI RAG',
		name: 'openWebUiRag',
		icon: 'file:openwebui-rag.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Use OpenWebUI Knowledge Base/RAG API',
		defaults: {
			name: 'OpenWebUI RAG',
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
				displayName: 'Document',
				name: 'document',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['addDocument'],
					},
				},
				description: 'Document content to add',
				typeOptions: {
					rows: 4,
				},
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['query'],
					},
				},
				description: 'Query to search for',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;

				if (operation === 'addDocument') {
					const document = this.getNodeParameter('document', i) as string;
					responseData = await makeRequest.call(this, 'POST', '/api/kb/add', {
						content: document,
					});
				} else if (operation === 'query') {
					const query = this.getNodeParameter('query', i) as string;
					responseData = await makeRequest.call(this, 'POST', '/api/kb/query', {
						query,
					});
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
