export type DataSource = 'local_device' | 'epic_fhir';

const DATA_SOURCE_KEY = 'unitview_data_source';
const DEFAULT_DATA_SOURCE: DataSource = 'local_device';

function isDataSource(value: string | null): value is DataSource {
  return value === 'local_device' || value === 'epic_fhir';
}

export const determineDataSource = (): DataSource => {
  const storedSource = localStorage.getItem(DATA_SOURCE_KEY);
  const source = isDataSource(storedSource) ? storedSource : DEFAULT_DATA_SOURCE;
  localStorage.setItem(DATA_SOURCE_KEY, source);
  return source;
};

export const getConfiguredDataSource = (): DataSource => determineDataSource();

export const setConfiguredDataSource = (source: DataSource): DataSource => {
  if (!isDataSource(source)) {
    throw new Error('Unsupported data source');
  }
  localStorage.setItem(DATA_SOURCE_KEY, source);
  return source;
};
