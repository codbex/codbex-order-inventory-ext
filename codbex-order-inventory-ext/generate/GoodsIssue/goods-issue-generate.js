const viewData = {
    id: 'goods-issue-generate',
    label: 'Generate Goods Issue',
    link: '/services/web/codbex-order-inventory-ext/generate/GoodsIssue/generate-goods-issue.html',
    perspective: 'SalesOrder',
    view: 'SalesOrder',
    type: 'entity',
    order: 10
};

if (typeof exports !== 'undefined') {
    exports.getDialogWindow = function () {
        return viewData;
    }
}