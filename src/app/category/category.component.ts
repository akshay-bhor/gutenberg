import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface booksApi {
    "count": number,
    "next": string | null,
    "previous": string | null,
    "results": [{}]
}

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryComponent implements OnInit {
  loading: boolean = false;
  initloading: boolean = false;
  category: string = '';
  httpSubscription?: Subscription;
  sQuery:string = '';
  bookRes?: any;
  page: number = 1;
  prev:string | null = '';
  next: string | null = 'http://gutendex.com/books/?mime_type=image&topic=' + this.category;

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit(): void {
    // Get route param
    this.category = this.route.snapshot.paramMap.get('category')!;

    // Fetch
    this.fetchBooks();
  }

  fetchBooks() {
    if(this.loading || this.initloading) return;

    // Cancel old subs
    this.cleanUp();

    // If no url
    if(!this.next) return;

    this.loading = true;
    if(this.page == 1)
      this.initloading = true;
    let url = this.next;
    this.httpSubscription = this.http.get<booksApi>(url).subscribe(res => {
      // Remember to append it don't overwrite it
      if(this.page == 1) {
        this.bookRes = res.results;
      }
      else { // Merge two
        this.bookRes = [...this.bookRes, ...res.results];
    }

      // next prev
      this.prev = res.previous;
      this.next = res.next;
      this.loading = false;
      this.initloading = false;
      
      this.page += 1;
    },
    (err) => {
      console.log(err);
      this.loading = false;
      this.initloading = false;
    });
  }

  search() {
    if(this.loading || this.initloading) {
      this.cleanUp();
    }  

    this.next = 'http://gutendex.com/books/?mime_type=image&topic=' + this.category + '&search=' + this.sQuery;

    this.page = 1;

    this.fetchBooks();
  }

  clearSearch() {
    this.cleanUp();
    this.page = 1;
    this.sQuery = '';
    this.next = 'http://gutendex.com/books/?mime_type=image&topic=' + this.category;
    this.fetchBooks();
  }

  @HostListener("window:scroll", [])
  onScroll(): void {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        this.fetchBooks();
      }
  }

  cleanUp() {
    this.loading = false;
    this.initloading = false;
    if(this.httpSubscription)
      this.httpSubscription.unsubscribe();
  }

  ngOnDestroy() {
    this.cleanUp();
  }

}
