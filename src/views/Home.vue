<template>
    <div class="home">
        <canvas id="fbc" ref="fbc" style="width: 90%;height: 600px;border: red solid 1px;"></canvas>
        <div>
            <span class="button" @click="onclickDraw">draw</span>
            <span class="button" @click="onclickSelect">select</span>
        </div>
    </div>
</template>

<script>
// @ is an alias to /src

// _cacheTransformEventData -> findTarget -> _searchPossibleTargets
import fabircPolyfill from './fabric.polyfill.js'
import fabricTable from './fabric.table.js'

export default {
    name: 'Home',
    components: {},
    methods: {
        onclickDraw() {
            window.cvs.isDrawingMode = true
        },
        onclickSelect() {
            window.cvs.isDrawingMode = false
        },
    },
    mounted() {

        const fabric = this.$fbc;
        const canvas = window.cvs = new fabric.Canvas('fbc', {
            width: 1000,
            height: 600,
            isDrawingMode: false
        });

        fabric.canvas = canvas;
        fabircPolyfill(fabric);
        log('canvas', canvas);

        const Table = fabricTable(fabric);
        const table = new Table({ hoverFillColor: 'blue', position: { x: 0, y: 0 } });
        const table2 = new Table({ hoverFillColor: 'red' });
        // table.on('mousedown', ({ e, target }) => {
        //     log('table down', target)
        // })
        // table.hasControls = false
        // table.hasBorders = false;
        // table.onSelect = function () {
        //     console.log(arguments)
        //     return true;
        // }

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



        canvas.add(table);
        canvas.add(table2);

        var rect = new fabric.Rect({

            left: 140,//距离画布左侧的距离，单位是像素

            top: 400,//距离画布上边的距离

            fill: 'green',//填充的颜色

            width: 150,//方形的宽度

            height: 100//方形的高度

        });
        var rect3 = new fabric.Rect({

            left: 180,//距离画布左侧的距离，单位是像素

            top: 500,//距离画布上边的距离

            fill: 'yellow',//填充的颜色

            width: 100,//方形的宽度

            height: 100//方形的高度

        });
        var circle = new fabric.Circle({

            left: 250,//距离画布左侧的距离，单位是像素

            top: 400,//距离画布上边的距离

            fill: 'gray',//填充的颜色
            radius: 20

        });
        // rect.activeOn = 'up'
        // rect.onSelect = function () {
        //     log('e', canvas.getActiveObjects())
        // }

        canvas.add(rect);
        // canvas.add(circle);
        canvas.add(rect3);
        // log(canvas.viewportTransform)
        // log(rect.calcTransformMatrix())
        // log(fabric.util.multiplyTransformMatrices(canvas.viewportTransform, rect.calcTransformMatrix()))
        // log(fabric.util.qrDecompose(rect.calcTransformMatrix()))
        // log(fabric.util.qrDecompose(canvas.viewportTransform))
    }
}
</script>

<style>
.button {
    padding: 10px;
    text-decoration: underline;
    cursor: pointer;
}
</style>