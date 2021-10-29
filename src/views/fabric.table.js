


export default function (fabric) {
    const canvas = fabric.canvas;
    const tableDrawingManager = {
        isDrawing: false,
        startPoint: { x: null, y: null },
        endPoint: { x: null, y: null },
        pathRange: {
            xmin: null,
            xmax: null,
            ymin: null,
            ymax: null
        },
        table: null,
        cell: null,
    }
    // if (!!fabric.Table) return;

    // const multiply = fabric.util.multiplyTransformMatrices;
    // const invert = fabric.util.invertTransform;

    const tableMap = new Map();// 存所有的表格

    const TableCell = fabric.util.createClass(fabric.Rect, {// 单元格
        type: 'tableCell',
        initialize: function (options = {}) {
            this.callSuper('initialize', options);
            this.ri = options.ri;
            this.ci = options.ci;
        },
        toObject() {
            return fabric.util.object.extend(this.callSuper('toObject'));
        },
        _render(ctx) {
            this.callSuper('_render', ctx);
        }
    });

    const Table = fabric.Table = fabric.util.createClass(fabric.Group, {
        type: 'table',
        // subTargetCheck: true,
        initialize({
            position = { x: 100, y: 100 },
            colunms = [100, 100, 100],
            rows = [100, 100, 100],
            fillColor = 'rgba(0,0,0,0)',
            strokeColor = '#ddd',
            hoverFillColor = 'rgba(0,0,0,0.1)',
            cellPadding = { top: 0, right: 0, bottom: 0, left: 0, },
            transformType = 'targetFixed'
        } = {}) {

            this.position = position;
            this._colunms = [];
            this._rows = [];
            this.allRelatedItems = new Map();
            this.left = position.x;
            this.top = position.y;
            Object.defineProperty(this, 'colunms', {
                get() { return this._colunms },
                set(v) {
                    this._colunms = v;
                    this.width = v.reduce((a, c) => a + c, 0)
                }
            })
            Object.defineProperty(this, 'rows', {
                get() { return this._rows },
                set(v) {
                    this._rows = v;
                    this.height = v.reduce((a, c) => a + c, 0)
                }
            })

            this.colunms = colunms;
            this.rows = rows;
            this.fillColor = fillColor;
            this.strokeColor = strokeColor;
            this.hoverFillColor = hoverFillColor;
            this.transformType = transformType;
            this.cellPadding = cellPadding;
            // this.hasControls = false
            // this.hasBorders = false;
            // this.hasRotatingPoint = false;

            const cells = this.makeCells(this.calcCellPWH());
            for (const c of cells) {
                c.group = this;// 添加父级引用
                c.relatedItems = new Set();// 存放和本cell关联对象的引用
            }

            this.bindEvents();
            this.callSuper('initialize', cells);
            tableMap.set(this, true);
        },

        calcCellPWH() {// 计算position width height
            let offsetY = 0;
            const rows = this.rows;
            const colunms = this.colunms;
            const position = this.position;
            const pwh = rows.flatMap((r, ri) => {
                let offsetX = 0;
                offsetY += (ri === 0 ? 0 : rows[ri - 1]);
                const y = position.y + offsetY;
                return colunms.map((c, ci) => {
                    offsetX += (ci === 0 ? 0 : colunms[ci - 1]);
                    const x = position.x + offsetX;
                    return { w: c, h: r, position: { x, y }, ri, ci }
                })
            })
            return pwh;
        },
        makeCells(pwh) {// 生成表格cells
            const cells = pwh.map(c => {
                return new TableCell({
                    ri: c.ri,
                    ci: c.ci,
                    left: c.position.x,
                    top: c.position.y,
                    width: c.w,
                    height: c.h,
                    fill: this.fillColor,
                    stroke: this.strokeColor
                })
            })
            return cells;
        },
        onSelectedFn({ e, target }) {
            if (target.allRelatedItems.size === 0) return;

            const objects = canvas.getActiveObjects()

            if (objects.length === 1) {// 如果只选中这个table，就创建分组
                const aGroup = new fabric.ActiveSelection([...target.allRelatedItems.keys(), target], { canvas });
                canvas.setActiveObject(aGroup, e);
                return;
            }

            // 如果选中多个对象，就把本table的关联对象更新进组
            for (const c of target.allRelatedItems.keys()) {
                if (!objects.find(cc => cc === c)) canvas._updateActiveSelection(c, e);
            }
        },
        bindEvents() {
            // rect.onSelect = function () {
            //     return true;
            // }
            // }

            // 跟随移动
            // let followers;
            // this.on('mousedown', ({ e, target }) => {
            //     if (this.relatedItems.size === 0) return;
            //     followers = [...this.relatedItems.keys()];
            //     const bossMatrix = this.calcTransformMatrix();
            //     const invertedBossMatrix = invert(bossMatrix);
            //     followers.forEach(o => {
            //         o.relationship = multiply(invertedBossMatrix, o.calcTransformMatrix());
            //     });
            // })
            // this.on('moving', (o) => {
            //     if (this.relatedItems.size === 0) return;
            //     followers.forEach(o => {
            //         const newMatrix = multiply(this.calcTransformMatrix(), o.relationship);
            //         const transform = fabric.util.qrDecompose(newMatrix);
            //         o.set({ flipX: false, flipY: false, });
            //         o.setPositionByOrigin({ x: transform.translateX, y: transform.translateY }, 'center', 'center');
            //         o.set(transform);
            //         o.setCoords();
            //     });
            // })
            // this.on('mouseup', () => {
            //     followers = null;
            // })

            // 选中表格时，同时选中关联的对象
            this.on('selected', this.onSelectedFn)
        },

        toObject: function () {
            return fabric.util.object.extend(this.callSuper('toObject'));
        },
        addToRelationship(target, cell) {// 添加关联关系
            target.relatedTable = this;
            target.relatedCell = cell;
            cell.relatedItems.add(target);
            this.allRelatedItems.set(target, true);
        },
        updateRelationship(target, cell) {// 更新关联的cell
            const oldCell = target.relatedCell;
            oldCell.relatedItems.delete(target);
            cell.relatedItems.add(target);
            target.relatedCell = cell;
        },
        delToRelationship(target) {// 删除关联关系
            target.relatedTable.allRelatedItems.delete(target);
            target.relatedTable = undefined;
            target.relatedCell.relatedItems.delete(target);
            target.relatedCell = undefined;
        },
        resetTableFill() {// 重置表格cell的填充色
            for (const c of this._objects) {
                c.set({ fill: this.fillColor })
            }
        },
        updatePosition() {// 更新自身保存的位置信息
            const center = this.group?.getCenterPoint();
            this.position = { x: (center?.x || 0) + this.left, y: (center?.y || 0) + this.top };
        },
        // toActiveSelection() {
        //     if (!this.canvas) return;
        //     const table = this;
        //     const objects = this._objects, canvas = this.canvas;
        //     this._objects = [];
        //     const options = this.toObject();
        //     delete options.objects;
        //     const activeSelection = new fabric.ActiveSelection([]);
        //     activeSelection.set(options);
        //     activeSelection.type = 'activeSelection';
        //     canvas.remove(this);
        //     objects.forEach(function (object) {
        //         object.group = activeSelection;
        //         object.dirty = true;
        //         canvas.add(object);
        //     });
        //     activeSelection.canvas = canvas;
        //     activeSelection._objects = objects;

        //     // 保存table属性
        //     activeSelection.position = table.position;
        //     activeSelection.relatedItems = table.relatedItems;
        //     activeSelection.hoverFillColor = table.hoverFillColor;
        //     activeSelection.transformType = table.transformType;
        //     activeSelection.cellPadding = table.cellPadding;
        //     activeSelection.strokeColor = table.strokeColor;
        //     activeSelection._colunms = table._colunms;
        //     activeSelection._rows = table._rows;

        //     canvas._activeObject = activeSelection;
        //     activeSelection.setCoords();
        //     return activeSelection;
        // },
        makeTableOptions() {
            const options = {};

            // 保存table属性
            options.position = this.position;
            options.allRelatedItems = this.allRelatedItems;
            options.hoverFillColor = this.hoverFillColor;
            options.transformType = this.transformType;
            options.cellPadding = this.cellPadding;
            options.strokeColor = this.strokeColor;
            options.colunms = this.colunms;
            options.rows = this.rows;
            options.objects = this._objects;
            return options;
        },
        toNewTable(options) {
            tableMap.delete(this);
            const newTable = new fabric.Table(options);

            newTable.allRelatedItems = options.allRelatedItems;// 将关联目标添加到新table
            options.objects.forEach((c, i) => {
                const nc = newTable._objects[i];
                const ccItems = nc.relatedItems = c.relatedItems;// 将各cell关联目标添加到新cell
                for (const tar of ccItems) {
                    tar.relatedCell = nc;// 更新关联目标对应的cell
                }
            });
            canvas.add(newTable);
            newTable.setCoords();
            for (const item of newTable.allRelatedItems.keys()) {
                item.relatedTable = newTable;// 更新目标关联的table
                item.bringToFront();// 在table上面显示
            }

            return newTable;
        }
    });

    function canContinue(target) {
        if (tableMap.get(target)) return;
        if (!canvas.iwb_allTableTargets) return;
        if (!['rect', 'path'].contains(target.type)) return;
        return true;
    }
    function updateTableSize(target, drawingOptions) {

        if (target.type === 'table') {
            target.updatePosition();
            return;
        }
        if (['activeSelection', 'group'].contains(target.type)) {
            const talbes = target._objects.filter(c => c.type === 'table')
            for (const tb of talbes) {
                tb.updatePosition();
            }
            return;
        }
        if (!canContinue(target)) return;
        const relatedTable = target.relatedTable;// 关联的表格
        if (!relatedTable) return;
        const relatedCell = target.relatedCell;// 关联的cell
        const tableCenter = relatedTable.getCenterPoint();// 表格中心点坐标

        const tableNewPosition = { x: null, y: null }
        const targetBoundingRect = target.getBoundingRect();
        const tl = targetBoundingRect.left;
        const tt = targetBoundingRect.top;
        const tw = targetBoundingRect.width;
        const th = targetBoundingRect.height;

        const cl = tableCenter.x + relatedCell.left;
        const ct = tableCenter.y + relatedCell.top;
        const cw = relatedCell.width;
        const ch = relatedCell.height;

        const cpl = relatedTable.cellPadding.left;
        const cpt = relatedTable.cellPadding.top;

        const rp = relatedTable.position;
        const tp = { x: targetBoundingRect.left, y: targetBoundingRect.top };
        const cp = { x: cl, y: ct };

        switch (relatedTable.transformType) {
            case 'targetFixed':
                // 计算调整后的列宽和行高
                const defer_wr = Math.max((tl + tw) - (cl + cw), 0);
                const defer_wl = Math.max((cl - tl), 0);
                const defer_hb = Math.max((tt + th) - (ct + ch), 0);
                const defer_ht = Math.max((ct - tt), 0);
                let newWidth = cw + defer_wr + defer_wl + cpl + relatedTable.cellPadding.right;// 新值
                let newHeight = ch + defer_ht + defer_hb + cpt + relatedTable.cellPadding.bottom;// 新值

                // 更新表格的列和行数据
                const originWidth = relatedTable.colunms[relatedCell.ci];// 旧值
                const originHeight = relatedTable.rows[relatedCell.ri];// 旧值

                const colunms = [...relatedTable.colunms];
                const rows = [...relatedTable.rows];

                colunms[relatedCell.ci] = Math.max(newWidth, originWidth);// 取大
                rows[relatedCell.ri] = Math.max(newHeight, originHeight);// 取大

                relatedTable.colunms = colunms;
                relatedTable.rows = rows;

                tableNewPosition.x = tp.x - cp.x + rp.x;
                tableNewPosition.y = tp.y - cp.y + rp.y;
                break;
            case 'tableFixed':
                // 待实现
                // const allItems = [...relatedCell.relatedItems];
                // const aw = allItems.reduce((a, c) => a + c.width, 0);
                // const ah = allItems.reduce((a, c) => a + c.height, 0);
                break;
            default:
                break;
        }

        // 表格新位置和原位置取小
        relatedTable.position = { x: Math.min(rp.x, tableNewPosition.x), y: Math.min(rp.y, tableNewPosition.y) }

        canvas.remove(relatedTable);// 移除原表格

        // 动画更新渲染
        // target.animate('left', tmlDefer + target.left + cpl, {
        //     from: target.animateOrigin.left,
        //     duration: 80,
        //     onChange: canvas.renderAll.bind(canvas)
        // });
        // target.animate('top', tmtDefer + target.top + cpt, {
        //     from: target.animateOrigin.top,
        //     duration: 80,
        //     onChange: canvas.renderAll.bind(canvas),
        //     onComplete() {
        //     }
        // });

        // 无动画更新渲染
        const newTable = relatedTable.toNewTable(relatedTable.makeTableOptions());
        const newTableCenter = newTable.getCenterPoint();

        // 存一份原表格的各cell坐标点
        relatedTable._objects.forEach((cell, i) => {
            newTable._objects[i].beforePosition = { x: cell.left + tableCenter.x, y: cell.top + tableCenter.y }
        })

        // 生成新table，更新关联item的位置
        const cellSet = new Set(newTable._objects);// 取新table的cells
        const newRelatedCell = target.relatedCell;
        cellSet.delete(newRelatedCell);// 当前cell内部的item位置不动
        for (const rcell of cellSet) {// 更新其他cells绑定的item位置
            const rItems = rcell.relatedItems;
            if (rItems.size === 0) continue;

            const afterPosition = { x: rcell.left + newTableCenter.x, y: rcell.top + newTableCenter.y }
            const deferx = rcell.ci === newRelatedCell.ci ? 0 : afterPosition.x - rcell.beforePosition.x;
            const defery = rcell.ri === newRelatedCell.ri ? 0 : afterPosition.y - rcell.beforePosition.y;
            for (const rItem of rItems) {
                rItem.set({ left: rItem.left + deferx, top: rItem.top + defery, })
            }
        }

        // 如果是在表格内画东西，更新drawing表格
        if (drawingOptions?.drawing) {
            tableDrawingManager.table = newTable;
            tableDrawingManager.cell = newTable._objects[tableDrawingManager.theCellIndex];
        }
    }

    // let movingCbEnd = true;
    canvas.on('object:moving', ({ e, target }) => {
        if (!canContinue(target)) return;
        if (target.type === "activeSelection") return;
        target.animateOrigin = {
            left: target.left,
            top: target.top,
        };

        const targetIsBinding = target.relatedTable?.allRelatedItems.has(target);
        // 在事件关联的目标中找出表格
        const tables = canvas.iwb_allTableTargets.filter(c => c.type === 'table');

        // 如果事件未关联表格
        if (tables.length === 0) {
            // 如果目标已经绑定到表格，就清除表格和target的关联
            if (targetIsBinding) {
                target.relatedTable.resetTableFill();
                target.relatedTable.delToRelationship(target);
            }
            return;
        }

        // if (tables.length === 1) tables[0].bringToFront();// 如果只有一个事件关联表格，提高这个表格的层级
        const upperTable = tables.shift();// 最上层的表格
        const uTableNoBinding = !upperTable.allRelatedItems.has(target);// 和最上层表格没有绑定

        // 如果目标已经绑定到表格，并且和最上层表格没有绑定，就撤销其他表格与target的联系
        if (targetIsBinding && uTableNoBinding) {
            for (const table of tableMap.keys()) {
                if (table === upperTable) continue;
                table.resetTableFill();
                table.delToRelationship(target);
            }
        }

        const cells = canvas.iwb_allTableTargets.filter(c => c.type === 'tableCell');// 在事件关联的目标中找出表格cells
        const theCell = cells.find(c => upperTable._objects.contains(c));// 最上层表格的事件关联cell
        // target和最上层表格建立联系
        if (uTableNoBinding) {
            upperTable.addToRelationship(target, theCell);
        } else {
            upperTable.updateRelationship(target, theCell);
        }

        // target.bringToFront();// 提高target层级
        upperTable.resetTableFill();
        theCell.set('fill', upperTable.hoverFillColor);// 修改
    });
    // canvas.on('selection:created', ({ e, selected, target }) => {
    //     log('selection:created')
    // });
    canvas.on('mouse:up', (o) => {
        if (!canvas.isDrawingMode) return;
        tableDrawingManager.isDrawing = false;
    });
    canvas.on('mouse:down', ({ e, pointer, target }) => {
        if (!canvas.isDrawingMode) return;
        tableDrawingManager.isDrawing = true;
        const inpointTables = canvas.iwb_findTargetsInPoint(e, 'table').slice(0, 2);
        // 取最上层的
        tableDrawingManager.table = inpointTables[0];
        tableDrawingManager.cell = inpointTables[1];

        const tp = tableDrawingManager.pathRange;
        if (!tableDrawingManager.cell || !tableDrawingManager.table) {
            tableDrawingManager.startPoint = { x: null, y: null };
            tp.xmax = null;
            tp.xmin = null;
            tp.ymax = null;
            tp.ymin = null;
            return;
        }
        tableDrawingManager.theCellIndex = tableDrawingManager.table._objects.findIndex(c => c === tableDrawingManager.cell);
        tableDrawingManager.startPoint = pointer;
        tp.xmax = pointer.x;
        tp.xmin = pointer.x;
        tp.ymax = pointer.y;
        tp.ymin = pointer.y;

    });
    canvas.on('mouse:move', (o) => {
        const { e, pointer, target, subTargets } = o;
        if (!canvas.isDrawingMode) return;
        if (!tableDrawingManager.isDrawing) return;

        if (!tableDrawingManager.cell || !tableDrawingManager.table) return;
        const tp = tableDrawingManager.pathRange;
        let tpxmax = tp.xmax;
        let tpxmin = tp.xmin;
        let tpymax = tp.ymax;
        let tpymin = tp.ymin;
        tpxmax = tp.xmax = Math.max(pointer.x, tpxmax);
        tpxmin = tp.xmin = Math.min(pointer.x, tpxmin);
        tpymax = tp.ymax = Math.max(pointer.y, tpymax);
        tpymin = tp.ymin = Math.min(pointer.y, tpymin);
        const virtualTarget = {
            type: 'path',
            relatedTable: tableDrawingManager.table,
            relatedCell: tableDrawingManager.cell,
            getBoundingRect() {
                return {
                    left: tpxmin,
                    top: tpymin,
                    width: tpxmax - tpxmin,
                    height: tpymax - tpymin,
                }
            }
        }

        updateTableSize(virtualTarget, { drawing: true, theCellIndex: tableDrawingManager.theCellIndex })
    });
    canvas.on('path:created', ({ path }) => {
        if (!tableDrawingManager.cell || !tableDrawingManager.table) return;
        // 添加和表格的关联关系
        path.relatedCell = tableDrawingManager.cell;
        path.relatedTable = tableDrawingManager.table;
        tableDrawingManager.cell.relatedItems.add(path);
        tableDrawingManager.table.allRelatedItems.set(path, true);
    });
    canvas.on('object:moved', ({ e, target }) => updateTableSize(target));
    canvas.on('object:rotating', ({ e, target }) => updateTableSize(target));
    canvas.on('object:scaling', ({ e, target }) => updateTableSize(target));
    canvas.on('object:skewing', ({ e, target }) => updateTableSize(target));
    // canvas.on('object:scaled', ({ e, target }) => updateTableSize(target));
    return Table;
};