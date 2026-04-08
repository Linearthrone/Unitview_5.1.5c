export type DataSource = 'local_device';

const DATA_SOURCE_KEY = 'unitview_data_source';
const DEFAULT_DATA_SOURCE: DataSource = 'local_device';

/**
 * Determines where UnitView should store/retrieve data.
 * For now we always use on-device local storage.
 */
export const determineDataSource = (): DataSource => {
  const storedSource = localStorage.getItem(DATA_SOURCE_KEY) as DataSource | null;
  const source = storedSource ?? DEFAULT_DATA_SOURCE;
  localStorage.setItem(DATA_SOURCE_KEY, source);
  return source;
};

export const getConfiguredDataSource = (): DataSource => determineDataSource();
