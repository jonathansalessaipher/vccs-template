import { Component, OnInit } from '@angular/core';
import notify from 'devextreme/ui/notify';
import { IProduct } from 'src/app/shared/interfaces/product.interface';
import { ProductsService } from 'src/app/shared/services';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {

  products: IProduct[] = [];

  constructor(private _productService: ProductsService) { }

  async ngOnInit() {
    this.loadProducts();
  }

  async loadProducts() {
    try {
      this.products = await this._productService.getProducts();
    } catch (error) {
      notify(error, 'error', 3000)
    }
  }

  async onRowInserting(event: any) {
    try {
      await this._productService.addProduct(event.data);
      notify("Produto adicionado com sucesso!", 'success');
    } catch (error) {
      notify(`Não foi possível adicionar o produto. ${error}`, 'error')
      event.cancel = true;
    }
  }

  async onRowUpdating(event: any) {
    try {
      await this._productService.updateProduct(event.key, event.newData);
      notify("Produto atualizado com sucesso!", 'success');
    } catch (error) {
      notify(`Não foi possível atualizar o produto. ${error}`, 'error')
      event.cancel = true;
    }
  }

  async onRowRemoving(event: any) {
    try {
      await this._productService.deleteProduct(event.data);
      notify("Produto removido com sucesso!", 'success');
    } catch (error) {
      notify(`Não foi possível remover o produto. ${error}`, 'error')
      event.cancel = new Promise((resolve, reject) => reject(true));
    }
  }

}
