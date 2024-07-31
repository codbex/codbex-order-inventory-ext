import { SalesOrderRepository as SalesOrderDao } from "../../../../codbex-orders/gen/codbex-orders/dao/SalesOrder/SalesOrderRepository";
import { SalesOrderItemRepository as SalesOrderItemDao } from "../../../../codbex-orders/gen/codbex-orders/dao/SalesOrder/SalesOrderItemRepository";
import { CatalogueRepository as CatalogueDao } from "../../../../codbex-products/gen/codbex-products/dao/Catalogues/CatalogueRepository";
import { ProductRepository as ProductDao } from "../../../../codbex-products/gen/codbex-products/dao/Products/ProductRepository";
import { GoodsIssueRepository as GoodsIssueDao } from "../../../../codbex-inventory/gen/codbex-inventory/dao/GoodsIssues/GoodsIssueRepository";
import { GoodsIssueItemRepository as GoodsIssueItemDao } from "../../../../codbex-inventory/gen/codbex-inventory/dao/GoodsIssues/GoodsIssueItemRepository";

import { Controller, Get, Post, Put, Body, Path } from "sdk/http";

@Controller
class GenerateGoodsIssueService {

    private readonly salesOrderDao;
    private readonly salesOrderItemDao;
    private readonly catalogueDao;
    private readonly productDao;
    private readonly goodsIssueDao;
    private readonly goodsIssueItemDao;

    constructor() {
        this.salesOrderDao = new SalesOrderDao();
        this.salesOrderItemDao = new SalesOrderItemDao();
        this.catalogueDao = new CatalogueDao();
        this.productDao = new ProductDao();
        this.goodsIssueDao = new GoodsIssueDao();
        this.goodsIssueItemDao = new GoodsIssueItemDao();
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
                    SalesOrder: salesOrder.Id
                }
            }
        });

        let itemsForIssue = [];

        salesOrderItems.forEach(item => {
            if (item.SalesOrderItemStatus != 4) {
                itemsForIssue.push(item);
            }
        })

        return {
            ItemsForIssue: itemsForIssue
        }
    }

    @Get("/catalogueData")
    public catalogueRecordsData(_: any, ctx: any) {
        try {
            let catalogueRecords = this.catalogueDao.findAll();

            if (!catalogueRecords || catalogueRecords.length === 0) {
                return {
                    error: "No catalogue records found!"
                };
            }

            return {
                CatalogueRecords: catalogueRecords
            };
        } catch (error) {
            ctx.res.sendStatus(400);
            return "An error occurred while fetching catalogue records!";
        }
    }

    @Get("/productData")
    public productsData(_: any, ctx: any) {
        try {
            let products = this.productDao.findAll();

            if (!products || products.length === 0) {
                return {
                    error: "No products found!"
                };
            }

            return {
                Products: products
            };
        } catch (error) {
            ctx.res.sendStatus(400);
            return "An error occurred while fetching products!";
        }
    }

    @Post("/goodsIssue")
    public createGoodsIssue(@Body() body: any, ctx: any) {
        try {
            const goodsIssue = this.goodsIssueDao.create(body);
            return goodsIssue;
        } catch (error) {
            ctx.res.sendStatus(400);
            return "An error occurred while creating Goods Issue!";
        }
    }

    @Post("/goodsIssueItem")
    public createGoodsIssueItem(@Body() body: any, ctx: any) {
        try {
            const goodsIssueItem = this.goodsIssueItemDao.create(body);
            return goodsIssueItem;
        } catch (error) {
            ctx.res.sendStatus(400);
            return "An error occurred while creating Goods Issue Item!";
        }
    }

    @Put("/salesOrderItem/:salesOrderItemId")
    public updateSalesOrderItem(@Path() salesOrderItemId: string, @Body() body: any, ctx: any) {
        try {
            let salesOrderItem = this.salesOrderItemDao.findById(salesOrderItemId);
            if (!salesOrderItem) {
                ctx.status = 404;
                ctx.body = {
                    error: "Sales order item not found"
                };
                return;
            }

            salesOrderItem = { ...salesOrderItem, ...body };
            this.salesOrderItemDao.update(salesOrderItemId, salesOrderItem);
            return salesOrderItem;
        } catch (error) {
            ctx.res.sendStatus(400);
            return "An error occurred while updating Sales Order Item!";
        }
    }
}
