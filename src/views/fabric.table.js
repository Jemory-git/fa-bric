


export default function (fabric, canvas) {


    const tableMap = new Map();

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

    const Table = fabric.util.createClass(fabric.Group, {

        type: 'table',
        // subTargetCheck: true,
        initialize({
            position = { x: 100, y: 100 },
            colunms = [100, 100, 100],
            rows = [100, 100, 100],
            fillColor = 'rgba(0,0,0,0.1)',
            hoverFillColor,
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
            this.hoverFillColor = hoverFillColor;
            // this.hasControls = false
            // this.hasBorders = false;
            // this.hasRotatingPoint = false;

            const cells = this.makeCells();
            this.cells = cells;
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
                    fill: this.fillColor,
                    width: c.w,
                    height: c.h,
                })
            })
            return cells;
        },
        bindEvents() {
            // let followers;
            // for (const cell of this.cells) {
            // rect.on('mousedown', ({ e, target }) => {
            //     log('rect down', target)
            //     followers = rects.filter(o => o !== target);
            //     const bossMatrix = target.calcTransformMatrix();
            //     const invertedBossMatrix = invert(bossMatrix);
            //     followers.forEach(o => {
            //         o.relationship = multiply(invertedBossMatrix, o.calcTransformMatrix());
            //     });
            // })
            // rect.on('moving', ({ e, target }) => {
            //     followers.forEach(o => {
            //         const newMatrix = multiply(rect.calcTransformMatrix(), o.relationship);
            //         const transform = fabric.util.qrDecompose(newMatrix);
            //         o.set({ flipX: false, flipY: false, });
            //         o.setPositionByOrigin({ x: transform.translateX, y: transform.translateY }, 'center', 'center');
            //         o.set(transform);
            //         o.setCoords();
            //     });
            // })
            // cell.on('mouseup', ({ e, target, subTargets }) => {
            // followers = [];
            // log('rect up', subTargets)
            // subTargets[0].set('fill', 'blue')
            // canvas.requestRenderAll()
            // })
            // rect.on('selected', ({ e, target }) => {
            //     log('selected', target)
            //     window.selected.set(target, true)
            // })
            // rect.onSelect = function () {
            //     console.log(arguments)
            //     return true;
            // }
            // }

            // 选中表格时，同时选中关联的对象
            this.on('selected', ({ e, target }) => {
                if (target.relatedItems.size === 0) return;
                const aGroup = new fabric.ActiveSelection([...target.relatedItems.keys(), this], { canvas });
                canvas.setActiveObject(aGroup, e);
            })
        },

        toObject: function () {
            return fabric.util.object.extend(this.callSuper('toObject'));
        },
        addToRelationship(obj, cell) {// 添加关联关系
            this.relatedItems.set(obj, { target: obj, table: this, cell })
        },
        delToRelationship(obj) {// 删除关联关系
            this.relatedItems.delete(obj)
        },
        resetTableFill() {// 重置表格cell的填充色
            for (const c of this.cells) {
                c.fill = this.fillColor;
            }
        },


        _render(ctx) {
            this.callSuper('_render', ctx);
            for (const c of this.cells) {
                c.table = this;// 添加父级引用
            }
        }
    });

    canvas.on('object:moving', ({ e, target }) => {
        if (tableMap.get(target)) return;
        if (target.type === "activeSelection") return;
        if (!window.iwb_allTargets) return;
        if (target.type !== "rect") return;
        // const pointer = canvas.getPointer(e);
        // for (const table of tableMap.keys()) {
        //     if (table.containsPoint(pointer)) log('table')
        //     for (const item of table.cells) {
        //         if (item.containsPoint(pointer)) log('item')
        //     }
        // }

        // 在事件关联的目标中找出表格
        const tables = window.iwb_allTargets.filter(c => c.type === 'table');

        // 如果事件未关联表格，就清除所有表格和target的关联
        if (tables.length === 0) {
            for (const table of tableMap.keys()) {
                table.delToRelationship(target);
                table.resetTableFill();
            }
            window.requestAnimationFrame(() => {
                canvas.requestRenderAll()
            })
            log(tableMap.keys())
            return;
        }

        if (tables.length === 1) tables[0].bringToFront();// 如果只有一个事件关联表格，提高这个表格的层级
        const cells = window.iwb_allTargets.filter(c => c.type === 'tableCell');// 在事件关联的目标中找出表格cells
        const upperTable = tables.shift();// 最上层的表格
        const theCell = cells.find(c => upperTable.cells.contains(c));// 最上层表格的事件关联cell

        // target和事件关联表格建立联系
        if (!upperTable.relatedItems.has(target)) upperTable.addToRelationship(target, theCell);

        // 撤销其他表格与target的联系
        for (const table of tableMap.keys()) {
            if (table === upperTable) continue;
            table.delToRelationship(target);
            table.resetTableFill();
        }

        target.bringToFront();// 提高target层级
        upperTable.resetTableFill();
        theCell.set('fill', upperTable.hoverFillColor);// 修改
        // canvas.requestRenderAll()


    });
    canvas.on('object:moved', ({ e, target }) => {
        if (tableMap.get(target)) return;
        log('moved')
    });


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