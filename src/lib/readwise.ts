import { ReadwiseHighlightExport as ReadwiseExport } from './types';

export const fetchFromExportApi = async (apiKey: string, updatedAfter?: number) => {
  let fullData: ReadwiseExport[] = [];
  let nextPageCursor: string | null = null;

  while (true) {
    const queryParams = new URLSearchParams();
    if (nextPageCursor) {
      queryParams.append('pageCursor', nextPageCursor);
    }
    if (updatedAfter) {
      queryParams.append('updatedAfter', updatedAfter.toString());
    }
    console.log('Making readwise export api request with params ' + queryParams.toString());
    const response = await fetch(`https://readwise.io/api/v2/export/?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });
    const responseJson = await response.json();
    fullData.push(...responseJson['results']);
    nextPageCursor = responseJson['nextPageCursor'];
    if (!nextPageCursor) {
      break;
    }
  }
  return fullData.map((x) => x.results).flat();
};
