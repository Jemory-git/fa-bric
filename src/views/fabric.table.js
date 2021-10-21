


export default function (fabric, canvas) {
    // if (!!fabric.Table) return;

    const multiply = fabric.util.multiplyTransformMatrices;
    const invert = fabric.util.invertTransform;

    const tableMap = new Map();
    const tableRelationAllItems = new Map();

    const TableCell = fabric.util.createClass(fabric.Rect, {
        type: 'tableCell',
        initialize: function (options = {}) {
            this.callSuper('initialize', options);
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
            objectOptions = {}
        } = {}) {

            this.position = position;
            this._colunms = [];
            this._rows = [];
            this.relatedItems = new Map();
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
            // this.hasControls = false
            // this.hasBorders = false;
            // this.hasRotatingPoint = false;

            const cells = this.makeCells();
            this.cells = cells;
            for (const c of cells) {
                c.group = this;// 添加父级引用
            }

            // if (objectOptions.originX) {
            //     this.originX = objectOptions.originX;
            // }
            // if (objectOptions.originY) {
            //     this.originY = objectOptions.originY;
            // }
            // this._calcBounds();
            // this._updateObjectsCoords();
            // fabric.Object.prototype.initialize.call(this, objectOptions);
            // this.setCoords();

            this.bindEvents();
            // this.selection = false
            this.callSuper('initialize', cells);
            tableMap.set(this, true);
        },

        makeCells() {
            let offsetY = 0;
            const rows = this.rows;
            const colunms = this.colunms;
            const position = this.position;
            const rectInfo = rows.flatMap((r, ri) => {
                let offsetX = 0;
                offsetY += (ri === 0 ? 0 : rows[ri - 1]);
                const y = position.y + offsetY;
                return colunms.map((c, ci) => {
                    offsetX += (ci === 0 ? 0 : colunms[ci - 1]);
                    const x = position.x + offsetX;
                    return { w: c, h: r, position: { x, y } }
                })
            })

            const cells = rectInfo.map(c => {
                return new TableCell({
                    left: c.position.x,
                    top: c.position.y,
                    width: c.w,
                    height: c.h,
                    fill: this.fillColor,
                    stroke: this.strokeColor,
                })
            })
            return cells;
        },
        bindEvents() {
            // rect.onSelect = function () {
            //     console.log(arguments)
            //     return true;
            // }
            // }

            // let followers;
            // this.on('mousedown', ({ e, target }) => {
            //     if (this.relatedItems.size === 0) return;
            //     log('rect down', this)
            //     followers = [...this.relatedItems.keys()];
            //     const bossMatrix = this.calcTransformMatrix();
            //     const invertedBossMatrix = invert(bossMatrix);
            //     followers.forEach(o => {
            //         o.relationship = multiply(invertedBossMatrix, o.calcTransformMatrix());
            //     });
            // })
            // this.on('moving', (o) => {
            //     log('moving')
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
            this.on('selected', ({ e, target }) => {
                if (target.relatedItems.size === 0) return;

                const objects = canvas.getActiveObjects()

                if (objects.length === 1) {// 如果只选中这个table，就创建分组
                    const aGroup = new fabric.ActiveSelection([...target.relatedItems.keys(), target], { canvas });
                    canvas.setActiveObject(aGroup, e);
                    return;
                }

                // 如果选中多个对象，就把本table的关联对象更新进组
                for (const c of target.relatedItems.keys()) {
                    if (!objects.find(cc => cc === c)) canvas._updateActiveSelection(c, e);
                }
            })
        },

        toObject: function () {
            return fabric.util.object.extend(this.callSuper('toObject'));
        },
        addToRelationship(obj, cell) {// 添加关联关系
            obj.relatedTable = this;
            this.relatedItems.set(obj, { target: obj, table: this, cell });
            tableRelationAllItems.set(obj);// 另存一份
        },
        delToRelationship(obj) {// 删除关联关系
            obj.relatedTable = undefined;
            this.relatedItems.delete(obj)
            tableRelationAllItems.delete(obj);
        },
        resetTableFill() {// 重置表格cell的填充色
            for (const c of this.cells) {
                // c.fill = this.fillColor;
                c.set({ fill: this.fillColor })
            }
        },
    });

    function canContinue(target) {
        if (tableMap.get(target)) return;
        if (target.type === "activeSelection") return;
        if (!fabric.iwb_allTargets) return;
        if (target.type !== "rect") return;
        return true;
    }

    canvas.on('object:moving', ({ e, target }) => {
        if (!canContinue(target)) return;
        // const pointer = canvas.getPointer(e);
        // for (const table of tableMap.keys()) {
        //     if (table.containsPoint(pointer)) log('table')
        //     for (const item of table.cells) {
        //         if (item.containsPoint(pointer)) log('item')
        //     }
        // }
        const targetIsBinding = tableRelationAllItems.has(target);

        // 在事件关联的目标中找出表格
        const tables = fabric.iwb_allTargets.filter(c => c.type === 'table');

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
        const uTableNoBinding = !upperTable.relatedItems.has(target);// 和最上层表格没有绑定

        // 如果目标已经绑定到表格，并且和最上层表格没有绑定，就撤销其他表格与target的联系
        if (targetIsBinding && uTableNoBinding) {
            for (const table of tableMap.keys()) {
                if (table === upperTable) continue;
                table.resetTableFill();
                table.delToRelationship(target);
            }
        }

        const cells = fabric.iwb_allTargets.filter(c => c.type === 'tableCell');// 在事件关联的目标中找出表格cells
        const theCell = cells.find(c => upperTable.cells.contains(c));// 最上层表格的事件关联cell
        // target和最上层表格建立联系
        if (uTableNoBinding) upperTable.addToRelationship(target, theCell);

        // target.bringToFront();// 提高target层级
        upperTable.resetTableFill();
        theCell.set('fill', upperTable.hoverFillColor);// 修改
    });
    canvas.on('object:moved', ({ e, target }) => {
        if (!canContinue(target)) return;
        log(target)
    });
    // canvas.on('selection:created', ({ e, selected, target }) => {
    //     log('selection:created')
    // });

    // let mouseDowning = false;
    // canvas.on('mouse:down', ({ e, target }) => {
    //     mouseDowning = true;
    //     if (!target) return;
    //     if (tableMap.get(target)) return;
    //     // log(target)
    // })
    // canvas.on('mouse:up', ({ e, target }) => {
    //     mouseDowning = false;
    // })
    // canvas.on('mouse:move', (o) => {
    //     const { e, target } = o;
    //     if (!mouseDowning) return;
    //     if (!target) return;
    //     // if (tableMap.get(target)) return;
    //     // log(target.getObjects())
    //     // log(o)
    // })
    return Table;
};