import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { makeRequest } from './resources/shared';

export class OpenWebUiTool implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OpenWebUI Tool',
		name: 'openWebUiTool',
		icon: 'file:openwebui-tool.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Use OpenWebUI Tools API',
		defaults: {
			name: 'OpenWebUI Tool',
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
				displayName: 'Tool Name',
				name: 'toolName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['execute'],
					},
				},
				description: 'Name of the tool to execute',
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

				if (operation === 'list') {
					responseData = await makeRequest.call(this, 'GET', '/api/tools/list');
				} else if (operation === 'execute') {
					const toolName = this.getNodeParameter('toolName', i) as string;
					responseData = await makeRequest.call(this, 'POST', '/api/tools/execute', {
						tool: toolName,
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
