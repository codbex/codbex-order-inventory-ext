import { SalesOrderRepository as SalesOrderDao } from "../../../../codbex-orders/gen/codbex-orders/dao/SalesOrder/SalesOrderRepository";
import { SalesOrderItemRepository as SalesOrderItemDao } from "../../../../codbex-orders/gen/codbex-orders/dao/SalesOrder/SalesOrderItemRepository";
import { CatalogueRepository as CatalogueDao } from "../../../../codbex-products/gen/codbex-products/dao/Catalogues/CatalogueRepository";
import { ProductPackagingRepository as ProductPackagingDao } from "../../../../codbex-products/gen/codbex-products/dao/Products/ProductPackagingRepository";
import { ProductRepository as ProductDao } from "../../../../codbex-products/gen/codbex-products/dao/Products/ProductRepository";

import { Controller, Get, Put, Post, response } from "sdk/http";

@Controller
class DeliveryNoteGenerateService {

    private readonly salesOrderDao;
    private readonly salesOrderItemDao;
    private readonly catalogueDao;
    private readonly productPackagingDao;
    private readonly productDao;


    constructor() {
        this.salesOrderDao = new SalesOrderDao();
        this.salesOrderItemDao = new SalesOrderItemDao();
        this.catalogueDao = new CatalogueDao();
        this.productPackagingDao = new ProductPackagingDao();
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
            "SentMethod": salesOrder.SentMethod,
            "Company": salesOrder.Company,
            "Status": salesOrder.Status,
            "Operator": salesOrder.Operator,
            "Reference": salesOrder.UUID,
            "Store": salesOrder.Store,
            "Name": salesOrder.Name
        };
    }

    @Get("/salesOrderItemsData/:salesOrderId")
    public salesOrderItemsData(_: any, ctx: any) {
        const salesOrderId = ctx.pathParameters.salesOrderId;

        let salesOrder = this.salesOrderDao.findById(salesOrderId);

        if (!salesOrder) {
            ctx.status = 404;
            ctx.body = {
                error: "Sales order not found"
            };
            return;
        }

        let salesOrderItems = this.salesOrderItemDao.findAll({
            $filter: {
                equals: {
                    SalesOrder: salesOrder.Id,
                    Status: 2 //Status: Issued which means there is availability for this product
                }
            }
        });

        salesOrderItems = salesOrderItems.map(item => {
            const product = this.productDao.findById(item.Product);
            return {
                ...item,
                ProductName: product?.Name
            };
        });

        return {
            ItemsToDeliver: salesOrderItems
        };
    }

    @Get("/catalogueData/:storeId")
    public catalogueRecordsData(_: any, ctx: any) {
        const storeId = ctx.pathParameters.storeId;

        let catalogueRecords = this.catalogueDao.findAll({
            $filter: {
                equals: {
                    Store: storeId
                }
            }
        });

        return {
            CatalogueData: catalogueRecords
        }
    }

    @Get("/productPackagingData/:productId")
    public productPackagingRecordsData(_: any, ctx: any) {
        const productId = ctx.pathParameters.productId;

        let productPackagingRecords = this.productPackagingDao.findAll({
            $filter: {
                equals: {
                    Product: productId
                }
            }
        });

        return {
            ProductPackagingData: productPackagingRecords
        }
    }

    @Put("/updateSalesOrderItem/:itemId")
    updateSalesOrderItems(_: any, ctx: any) {
        const itemId = ctx.pathParameters.itemId;
        const item = this.salesOrderItemDao.findById(itemId);

        item.Status = 4;

        this.salesOrderItemDao.update(item);
    }
}