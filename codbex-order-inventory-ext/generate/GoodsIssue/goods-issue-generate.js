exports.getAction = function () {
    return {
        id: 'goods-issue-generate',
        label: 'Generate Goods Issue',
        perspective: 'SalesOrder',
        view: 'SalesOrder',
        type: 'entity',
        link: '/services/web/codbex-order-inventory-ext/generate/GoodsIssue/generate-goods-issue.html'
    }
}