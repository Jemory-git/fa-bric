<template>
    <div class="home">
        <canvas id="fbc" ref="fbc" style="width: 90%;height: 600px;border: red solid 1px;"></canvas>
    </div>
</template>

<script>
// @ is an alias to /src

export default {
    name: 'Home',
    components: {},
    mounted() {
        window.selected = new Map()

        const fabric = this.$fbc;
        const multiply = fabric.util.multiplyTransformMatrices;
        const invert = fabric.util.invertTransform;
        const canvas = new fabric.Canvas('fbc', {
            width: 1000,
            height: 600
        });
        console.log('canvas', canvas);

        const tableMap = new Map();

        const Table = fabric.util.createClass(fabric.Rect, {

            type: 'table',
            initialize({
                position = { x: 100, y: 100 },
                colunms = [50, 30, 80],
                rows = [50, 40, 20],
            } = {}) {

                this.callSuper('initialize');
                this.position = position;
                this._colunms = [];
                this._rows = [];
                this.relatedItems = [];
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

                const rects = this.bindEvents(this.makeRects(this.makeCells()));
                console.log('this', this)
                this.items = [...rects];
                this.selection = false
            },

            makeCells() {
                let offsetY = 0;
                const rows = this.rows;
                const colunms = this.colunms;
                const position = this.position;
                const cells = rows.flatMap((r, ri) => {
                    let offsetX = 0;
                    offsetY += (ri === 0 ? 0 : rows[ri - 1]);
                    const y = position.y + offsetY;
                    return colunms.map((c, ci) => {
                        offsetX += (ci === 0 ? 0 : colunms[ci - 1]);
                        const x = position.x + offsetX;
                        return { w: c, h: r, position: { x, y } }
                    })
                })
                console.log(cells)
                return cells
            },

            makeRects(cells) {
                const rects = cells.map(c => {
                    const rect = new fabric.Rect({ left: c.position.x, top: c.position.y, fill: 'red', width: c.w, height: c.h, });
                    rect.hasControls = false
                    rect.hasBorders = false;
                    // rect.hasRotatingPoint = false;
                    return rect
                })
                return rects;
            },
            bindEvents(rects) {
                let followers;
                for (const rect of rects) {
                    rect.on('mousedown', ({ e, target }) => {
                        log('rect down', target)
                        followers = rects.filter(o => o !== target);
                        const bossMatrix = target.calcTransformMatrix();
                        const invertedBossMatrix = invert(bossMatrix);
                        followers.forEach(o => {
                            o.relationship = multiply(invertedBossMatrix, o.calcTransformMatrix());
                        });
                    })
                    rect.on('moving', ({ e, target }) => {
                        followers.forEach(o => {
                            const newMatrix = multiply(rect.calcTransformMatrix(), o.relationship);
                            const transform = fabric.util.qrDecompose(newMatrix);
                            o.set({ flipX: false, flipY: false, });
                            o.setPositionByOrigin({ x: transform.translateX, y: transform.translateY }, 'center', 'center');
                            o.set(transform);
                            o.setCoords();
                        });
                    })
                    rect.on('mouseup', ({ e, target }) => {
                        followers = [];
                    })
                    rect.on('selected', ({ e, target }) => {
                        log('selected', target)
                        window.selected.set(target, true)
                    })
                    // rect.onSelect = function () {
                    //     return true;
                    // }
                }
                return rects;
            },

            toObject: function () {
                return fabric.util.object.extend(this.callSuper('toObject'), {
                    label: this.get('label')
                });
            },

            _render(ctx) {
                this.callSuper('_render', ctx);
                for (const i of this.items) {
                    i.table = this;
                    canvas.add(i);
                }
            }
        });

        const table = new Table();
        table.on('mousedown', ({ e, target }) => {
            log('table down', target)
        })
        table.hasControls = false
        table.hasBorders = false;
        console.log('table', table)
        // const table = {
        //     position: { x: 100, y: 100 },
        //     colunms: [50, 30, 80],
        //     rows: [50, 40, 20],
        //     width: 0,
        //     height: 0,
        //     combine: [
        //         [{ r: 1, c: 1 }, { r: 1, c: 2 }],
        //         [{ r: 2, c: 1 }, { r: 2, c: 2 }],
        //     ],
        //     allPoints: [
        //         [{ x: 100, y: 100 }, { x: 150, y: 100 },],
        //         [{ x: 100, y: 150 }, { x: 150, y: 150 },],
        //         [{ x: 100, y: 200 }, { x: 150, y: 200 },],
        //     ]
        // }



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

        canvas.on('object:moving', ({ e, target }) => {
            if (tableMap.get(target)) return;
            log('moving')
        });
        canvas.on('object:moved', ({ e, target }) => {
            if (tableMap.get(target)) return;
            log('moved')
        });


        canvas.add(table);
        tableMap.set(table, true);

        var rect = new fabric.Rect({

            left: 140,//距离画布左侧的距离，单位是像素

            top: 400,//距离画布上边的距离

            fill: 'blue',//填充的颜色

            width: 30,//方形的宽度

            height: 30//方形的高度

        });
        rect.on('mousedown', () => {
            log('rect down')
        })

        canvas.add(rect);
        // log(canvas.viewportTransform)
        // log(rect.calcTransformMatrix())
        // log(fabric.util.multiplyTransformMatrices(canvas.viewportTransform, rect.calcTransformMatrix()))
        // log(fabric.util.qrDecompose(rect.calcTransformMatrix()))
        // log(fabric.util.qrDecompose(canvas.viewportTransform))
    }
}
</script>
