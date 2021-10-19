
Array.prototype.contains = function (o) {
    for (const c of this) {
        if (c === o) return true;
    }
}
export default function (canvas) {
    Object.getPrototypeOf(canvas)._cacheTransformEventData = function (e) {// 改写fabric原有方法
        this._resetTransformEventData();
        this._pointer = this.getPointer(e, true);
        this._absolutePointer = this.restorePointerVpt(this._pointer);
        this._target = this._currentTransform ? (this.iwb_findOtherTargets(e), this._currentTransform.target) : this.findTarget(e) || null;
    }
    Object.getPrototypeOf(canvas).iwb_findOtherTargets = function (e) {// 新增查找目标的方法
        var ignoreZoom = true,
            pointer = this.getPointer(e, ignoreZoom),
            activeObject = this._activeObject,
            aObjects = this.getActiveObjects();

        if (aObjects.length === 1 && activeObject === this._searchPossibleTargets([activeObject], pointer)) {
            const iwb_allTargets = this.iwb_searchAllTargets(this._objects, pointer);
            // log('111111111111111111111111111111111111111111111', iwb_allTargets)
            window.iwb_allTargets = iwb_allTargets;// 保存在window下
        }
    }
    Object.getPrototypeOf(canvas).iwb_searchAllTargets = function (objects, pointer) {// 新增查找目标的方法
        var i = objects.length;
        const allTargets = [];
        while (i--) {
            var objToCheck = objects[i];
            var pointerToUse = objToCheck.group ? this._normalizePointer(objToCheck.group, pointer) : pointer;
            if (this._checkTarget(pointerToUse, objToCheck, pointer)) {
                allTargets.push(objToCheck);
                if (objToCheck instanceof fabric.Group) {
                    const rect = this._searchPossibleTargets(objToCheck._objects, pointer);
                    if (rect) allTargets.push(rect);
                }
            }
        }
        return allTargets;
    }
}