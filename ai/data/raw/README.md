# Raw Dataset

Place the Kaggle medication adherence dataset files in this directory.

The training script automatically scans for the first supported file with one of these extensions:

- `.csv`
- `.xlsx`
- `.xls`

If no dataset is found, the service falls back to a synthetic bootstrap dataset so the API can still run locally.
