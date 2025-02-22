import { ICredentialDataDecryptedObject, IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';

export interface IOpenWebUiCredentials extends ICredentialDataDecryptedObject {
	apiUrl: string;
	jwtToken: string;
}

export async function makeRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: string,
	endpoint: string,
	body?: object,
) {
	const credentials = await this.getCredentials('openWebUiApi') as unknown as IOpenWebUiCredentials;

	if (!this.helpers?.request) {
		throw new Error('Request helper is not available');
	}

	return this.helpers.request({
		method,
		url: `${credentials.apiUrl}${endpoint}`,
		headers: {
			'Accept': 'application/json',
			'Authorization': `Bearer ${credentials.jwtToken}`,
		},
		body,
		json: true,
	});
}
