import { SalesOrderRepository as SalesOrderDao } from "../../../../codbex-orders/gen/codbex-orders/dao/SalesOrder/SalesOrderRepository";
import { SalesOrderItemRepository as SalesOrderItemDao } from "../../../../codbex-orders/gen/codbex-orders/dao/SalesOrder/SalesOrderItemRepository";
import { CatalogueRepository as CatalogueRepositoryDao } from "../../../../codbex-products/gen/codbex-products/dao/Catalogues/CatalogueRepository";
import { ProductRepository as ProductDao } from "../../../../codbex-products/gen/codbex-products/dao/Products/ProductRepository";

import { Controller, Get } from "sdk/http";

@Controller
class GenerateGoodsIssueService {

    private readonly salesOrderDao;
    private readonly salesOrderItemDao;
    private readonly catalogueRepositoryDao;
    private readonly productDao;

    constructor() {
        this.salesOrderDao = new SalesOrderDao();
        this.salesOrderItemDao = new SalesOrderItemDao();
        this.catalogueRepositoryDao = new CatalogueRepositoryDao();
        this.productDao = new ProductDao();
    }

    @Get("/salesOrderData/:salesOrderId")
    public salesOrderData(_: any, ctx: any) {
        const salesOrderId = ctx.pathParameters.salesOrderId;

        let salesOrder = this.salesOrderDao.findById(salesOrderId);

        return {
            "Date": salesOrder.Date,
            "Due": salesOrder.Due,
            "Customer": salesOrder.Customer,
            "Net": salesOrder.Net,
            "Currency": salesOrder.Currency,
            "Gross": salesOrder.Gross,
            "Discount": salesOrder.Discount,
            "Taxes": salesOrder.Taxes,
            "VAT": salesOrder.VAT,
            "Total": salesOrder.Total,
            "Conditions": salesOrder.Conditions,
            "PaymentMethod": salesOrder.PaymentMethod,
            "SentMethod": salesOrder.SentMethod,
            "Company": salesOrder.Company,
            "SalesOrderStatus": 1,
            "Operator": salesOrder.Operator,
            "Reference": salesOrder.UUID,
            "Store": salesOrder.Store
        };
    }

    @Get("/salesOrderItemsData/:salesOrderId")
    public salesOrderItemsData(_: any, ctx: any) {
        const salesOrderId = ctx.pathParameters.salesOrderId;

        let salesOrder = this.salesOrderDao.findById(salesOrderId);

        let salesOrderItems = this.salesOrderItemDao.findAll({
            $filter: {
                equals: {
                    SalesOrder: salesOrder.Id
                }
            }
        });

        let itemsInStock = [];
        let itemsToRestock = [];

        for (let item of salesOrderItems) {
            if (item.SalesOrderItemStatus != 2) {
                const catalogueRecords = this.catalogueRepositoryDao.findAll({
                    $filter: {
                        equals: {
                            Store: salesOrder.Store,
                            Product: item.Product,
                        },
                    },
                });
                if (catalogueRecords.length > 0) {
                    const catalogueRecord = catalogueRecords[0];
                    if (catalogueRecord.Quantity >= item.Quantity) {
                        item.SalesOrderItemStatus = 2;
                        this.salesOrderItemDao.update(item);
                        itemsInStock.push(item);
                    } else if (catalogueRecord.Quantity > 0) {
                        let restockOrder = { ...item, Quantity: item.Quantity - catalogueRecord.Quantity, SalesOrderItemStatus: 3 };
                        this.salesOrderItemDao.create(restockOrder);

                        let partialOrder = { ...item, Quantity: catalogueRecord.Quantity, SalesOrderItemStatus: 2 };
                        this.salesOrderItemDao.update(partialOrder);

                        itemsInStock.push(partialOrder);
                        itemsToRestock.push(restockOrder);
                    } else {
                        item.SalesOrderItemStatus = 3;
                        this.salesOrderItemDao.update(item);
                        itemsToRestock.push(item);
                    }
                } else {
                    item.SalesOrderItemStatus = 3;
                    this.salesOrderItemDao.update(item);
                    itemsToRestock.push(item);
                }
            }
        }

        // Fetch product names
        itemsInStock = this.addProductNames(itemsInStock);
        itemsToRestock = this.addProductNames(itemsToRestock);

        return {
            "ItemsForIssue": itemsInStock,
            "ItemsToRestock": itemsToRestock
        };
    }

    private addProductNames(items: any[]) {
        for (let item of items) {
            const product = this.productDao.findById(item.Product);
            item.ProductName = product.Name;
        }
        return items;
    }
}
