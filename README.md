# ext-js-overrides

These are the ExtJS overrides I wrote to allow the columns in an ExtJS grid to be sorted (if sortable), fixed (if fixable) and renamed.  
The state change of the columns also had to be fed back to the server, requiring events (e.g. onColumnSortChanged, onColumnFixChanged) to be fired.