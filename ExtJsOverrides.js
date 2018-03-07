$(function () {

	Ext.override(Ext.grid.GridView, {
		handleHdDown: function (e, target) {
			if (Ext.fly(target).hasClass('x-grid3-hd-btn')) {
				e.stopEvent();

				var colModel = this.cm,
					header = this.findHeaderCell(target),
					index = this.getCellIndex(header),
					sortable = colModel.isSortable(index),
					menu = this.hmenu,
					menuItems = menu.items,
					menuCls = this.headerMenuOpenCls;

				this.hdCtxIndex = index;

				var columnConfig = colModel.config[this.hdCtxIndex];

				Ext.fly(header).addClass(menuCls);

				// Set the state of the sorting menu items
				if (sortable) {
					menuItems.get('asc').show();
					menuItems.get('desc').show();

					var isColumnSorted = columnConfig.sorted;
					if (isColumnSorted) {
						if (columnConfig.sortDirection == 'ASC') {
							// Disable asc menu item and enable desc menu item if the column is sorted ascending
							menuItems.get('asc').setDisabled(true);
							menuItems.get('desc').setDisabled(false);
						}
						else {
							// Enable asc menu item and disable desc menu item if the column is sorted descending
							menuItems.get('asc').setDisabled(false);
							menuItems.get('desc').setDisabled(true);
						}
					}
					else {
						// Enable both sorting menu items if the column is not sorted
						menuItems.get('asc').setDisabled(false);
						menuItems.get('desc').setDisabled(false);
					}
				}
				else {
					// Hide the sorting menu items if the column is not sortable
					menuItems.get('asc').hide();
					menuItems.get('desc').hide();
				}

				// Set whether the fixed checkbox is checked
				if (this.grid.enableColumnFix) {
					var isColumnFixable = columnConfig.fixable;
					if (isColumnFixable) {
						var isColumnFixed = columnConfig.fixed;
						menuItems.get("fixed").setChecked(isColumnFixed);
						menuItems.get("fixed").show();
					}
					else {
						menuItems.get("fixed").hide();
					}
				}

				menu.on('hide', function () {
					Ext.fly(header).removeClass(menuCls);
				}, this, { single: true });

				menu.show(target, 'tl-bl?');
			}
		}
	});

	Ext.override(Ext.grid.GridView, {
		afterRenderUI: function () {
			var grid = this.grid;
			this.initElements();
			Ext.fly(this.innerHd).on("click", this.handleHdDown, this);
			this.mainHd.on({
				scope: this,
				mouseover: this.handleHdOver,
				mouseout: this.handleHdOut,
				mousemove: this.handleHdMove
			});
			this.scroller.on("scroll", this.syncScroll, this);
			if (grid.enableColumnResize !== false) {
				this.splitZone = new Ext.grid.GridView.SplitDragZone(grid, this.mainHd.dom)
			}
			if (grid.enableColumnMove) {
				this.columnDrag = new Ext.grid.GridView.ColumnDragZone(grid, this.innerHd);
				this.columnDrop = new Ext.grid.HeaderDropZone(grid, this.mainHd.dom);
			}
			if (grid.enableHdMenu !== false) {
				this.hmenu = new Ext.menu.Menu({
					id: grid.id + "-hctx"
				});
				this.hmenu.add({
					itemId: "asc",
					text: this.sortAscText,
					cls: "xg-hmenu-sort-asc"
				}, {
					itemId: "desc",
					text: this.sortDescText,
					cls: "xg-hmenu-sort-desc"
				});
				if (grid.enableColumnHide !== false) {
					this.colMenu = new Ext.menu.Menu({
						id: grid.id + "-hcols-menu"
					});
					this.colMenu.on({
						scope: this,
						beforeshow: this.beforeColMenuShow,
						itemclick: this.handleHdMenuClick
					});
					this.hmenu.add("-", {
						itemId: "columns",
						hideOnClick: false,
						text: this.columnsText,
						menu: this.colMenu,
						iconCls: "x-cols-icon"
					});
				}

				// New fixable configuration
				if (grid.enableColumnFix === true) {
					this.hmenu.add(new Ext.menu.CheckItem({
						text: "Fixed",
						itemId: "fixed",
						checked: "false",
						disabled: false,
						hideOnClick: false
					}));
				}

				// Edit column header
				this.hmenu.add({
					text: "Rename",
					itemId: "edit",
					cls: "xg-hmenu-edit"
				});

				this.hmenu.on("itemclick", this.handleHdMenuClick, this);
			}
			if (grid.trackMouseOver) {
				this.mainBody.on({
					scope: this,
					mouseover: this.onRowOver,
					mouseout: this.onRowOut
				});
			}
			if (grid.enableDragDrop || grid.enableDrag) {
				this.dragZone = new Ext.grid.GridDragZone(grid, {
					ddGroup: grid.ddGroup || "GridDD"
				});
			}
			this.updateHeaderSortState();
		}
	});

	Ext.override(Ext.grid.GridView, {
		handleHdMenuClick: function (item) {
			var store = this.ds,
				dataIndex = this.cm.getDataIndex(this.hdCtxIndex);
			switch (item.getItemId()) {
				case "asc":
					if (this.cm.isSortable(this.hdCtxIndex) && $.isFunction(this.grid.onColumnSortChanged)) {
						this.grid.onColumnSortChanged(dataIndex, 'ASC');
					}
					break;
				case "desc":
					if (this.cm.isSortable(this.hdCtxIndex) && $.isFunction(this.grid.onColumnSortChanged)) {
						this.grid.onColumnSortChanged(dataIndex, 'DESC');
					}
					break;
				case "fixed":
					if (this.grid.enableColumnFix && $.isFunction(this.grid.onColumnFixChanged)) {
						var columnConfig = this.cm.config[this.hdCtxIndex];
						if (columnConfig.fixable) {
							// The value of item.checked is before the item was clicked
							this.grid.onColumnFixChanged(dataIndex, !item.checked);
							item.parentMenu.hide();
						}
					}
					break;
				case "edit":
					item.parentMenu.hide();

					var _cm = this.cm;
					var _hdCtxIndex = this.hdCtxIndex;
					var _grid = this.grid;
					var headerEditor = new Ext.Editor({
						shadow: false,
						completeOnEnter: true,
						cancelOnEsc: true,
						updateEl: false,
						ignoreNoChange: true,
						alignment: 'tl-tl',
						offsets: [2, 0],
						listeners: {
							complete: function (ed, value, oldValue) {
								if (value.search(/[^a-zA-Z0-9 \( \) _ -]/) != -1) {
									$(this.boundEl.applyStyles("color: red").dom).animate({ color: '#444' }, 1500);
								}
								else {
									_cm.setColumnHeader(_hdCtxIndex, value);
									_grid.onColumnHeaderChanged(dataIndex, value);
								}
							}
						},
						field: {
							allowBlank: false,
							xtype: 'textfield',
							selectOnFocus: true,
							cls: 'ext-column-header-editor'
						}
					});

					headerEditor.startEdit(this.getHeaderCell(_hdCtxIndex), _cm.getColumnHeader(_hdCtxIndex));

				default:
					this.handleHdMenuClickDefault(item);
			}
			return true
		}
	});

	Ext.override(Ext.grid.GridView, {
		onHeaderClick: function (g, index) {
			if (this.headersDisabled || !this.cm.isSortable(index)) {
				return;
			}
			g.stopEditing(true);
			if ($.isFunction(this.grid.onColumnSortChanged)) {
				this.grid.onColumnSortChanged(this.cm.getDataIndex(index));
			}
		}
	});

});