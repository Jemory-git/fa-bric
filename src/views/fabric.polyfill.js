
Array.prototype.contains = function (o) {
    for (const c of this) {
        if (c === o) return true;
    }
}
export default function (fabric) {
    const canvas = fabric.canvas;
    Object.getPrototypeOf(canvas)._cacheTransformEventData = function (e) {// 改写fabric原有方法
        this._resetTransformEventData();
        this._pointer = this.getPointer(e, true);
        this._absolutePointer = this.restorePointerVpt(this._pointer);
        this._target = this._currentTransform ? (this.iwb_findTableTargets(e), this._currentTransform.target) : this.findTarget(e) || null;
    }
    Object.getPrototypeOf(canvas).iwb_findTableTargets = function (e) {// 新增查找目标的方法
        const ignoreZoom = true;
        const pointer = this.getPointer(e, ignoreZoom);
        const activeObject = this._activeObject;
        const aObjects = this.getActiveObjects();

        if (aObjects.length === 1 && activeObject === this._searchPossibleTargets([activeObject], pointer)) {
            const tables = this._objects.filter(c => c.type === 'table');
            this.iwb_allTableTargets = this.iwb_searchAllTargets(tables, pointer);
        }
    }
    Object.getPrototypeOf(canvas).iwb_findTargetsInPoint = function (e, type) {// 新增查找目标的方法
        if (type == null) return;
        const pointer = this.getPointer(e, true);
        let tables = this._objects.filter(c => c.type === type);
        return this.iwb_allTableTargets = this.iwb_searchAllTargets(tables, pointer);
    }
    Object.getPrototypeOf(canvas).iwb_searchAllTargets = function (objects, pointer) {// 新增查找目标的方法
        let i = objects.length;
        const allTargets = [];
        while (i--) {
            const objToCheck = objects[i];
            const pointerToUse = objToCheck.group ? this._normalizePointer(objToCheck.group, pointer) : pointer;
            // log('this._checkTarget(pointerToUse, objToCheck, pointer)', this._checkTarget(pointerToUse, objToCheck, pointer))
            if (!this._checkTarget(pointerToUse, objToCheck, pointer)) continue;

            allTargets.push(objToCheck);
            if (objToCheck instanceof fabric.Group) {
                const subTargets = this.iwb_searchAllTargets(objToCheck._objects, pointer);
                allTargets.push(subTargets);
            }
        }
        return allTargets.flat();
    }
}