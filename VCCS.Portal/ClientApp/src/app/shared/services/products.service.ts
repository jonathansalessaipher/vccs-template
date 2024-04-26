import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map } from 'rxjs/operators';

import { IProduct } from '../interfaces/product.interface';
import { ErrorHandler } from '../utils';
import { IResponse } from './../interfaces/response.interfaces';

@Injectable()
export class ProductsService extends ErrorHandler {

  private _baseUrl = 'v1/product'

  constructor(private _http: HttpClient) { super() }

  addProduct(product: IProduct) {
    return this._http.post<IResponse<any>>(this. _baseUrl, product)
      .pipe(
        map( response => response.success!),
        catchError(this.handleError)
      )
      .toPromise()
  }

  getProducts(): Promise<IProduct[]> {

    // ***************************************************************************
    // Mock
    // ***************************************************************************
    return new Promise((resolve, reject) => {
      setTimeout(
        () => resolve( [
          { id: 'a90390b0-568d-43a6-98cb-625856906733', name: 'Arroz', value: 15, quantity: 45},
          { id: 'a90390b0-568d-43a6-98cb-625856906734', name: 'Feijão', value: 8, quantity: 100},
          { id: 'a90390b0-568d-43a6-98cb-625856906735', name: 'Farinha', value: 4, quantity: 20},
          { id: 'a90390b0-568d-43a6-98cb-625856906736', name: 'Macarrão', value: 2.50, quantity: 150}
        ] as IProduct[])
        , 2000)
    });

    // return this._http
    //   .get<IResponse<IProduct[]>>(this._baseUrl)
    //   .pipe(
    //     map( response => response.data!),
    //     catchError(this.handleError)
    //   )
    //   .toPromise()
  }

  updateProduct(id: string, product: IProduct) {
    return this._http.put<IResponse<any>>(`${this._baseUrl}/${id}`, product)
      .pipe(
        map( response => response.success!),
        catchError(this.handleError)
      )
      .toPromise();
  }

  deleteProduct(id: string) {
    return this._http.delete<IResponse<boolean>>(`${this._baseUrl}/${id}`)
      .pipe(
        map(response => response.success!),
        catchError(this.handleError)
      )
      .toPromise();
  }

}



