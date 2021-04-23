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
  next: string | null = '';
  errMsg = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit(): void {
    // Get route param
    this.category = this.route.snapshot.paramMap.get('category')!;
    this.next = 'http://gutendex.com/books/?mime_type=image&topic=' + this.category;
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
      // Check values length
      if(res.results.length < 1) {
        this.showAlert('No books found!');
      }

      // Remember to append it don't overwrite it
      if(this.page == 1) {
        this.bookRes = res.results;
      }
      else { // Merge two
        this.bookRes = [...this.bookRes, ...res.results];
    }
    console.log(this.bookRes);
      // next prev
      this.prev = res.previous;
      this.next = res.next;
      this.loading = false;
      this.initloading = false;
      
      this.page += 1;
    },
    (err) => {
      console.log(err);
      this.showAlert(err.statusText);
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

  openLink(formats:any) {
    // Html PDF Text

    // Find html key
    const htmlKey = Object.keys(formats).find(key => {
      if(key == 'text/html') return key;
      if(key.split(';')[0] == 'text/html') return key;
      return null;
    });
    // Find Text key
    const textKey = Object.keys(formats).find(key => {
      if(key == 'text/plain') return key;
      if(key.split(';')[0] == 'text/plain') return key;
      return null;
    });

    if(htmlKey && formats[htmlKey]) {
      window.open(formats[htmlKey], '_blank');
    }
    else if(formats['application/pdf']) {
      window.open(formats['text/html; charset=utf-8'], '_blank');
    }
    else if(textKey && formats[textKey]) {
      window.open(formats[textKey], '_blank');
    }
    else {
      // Show err
      this.showAlert('No viewable version available');
    }
  }

  showAlert(errMsg:string) { console.log(errMsg)
    this.errMsg = errMsg;
    setTimeout(() => this.errMsg = '', 3000);
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
  if((window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 50)) {
        this.fetchBooks();
    }
  }

  cleanUp() {
    this.loading = false;
    this.initloading = false;
    this.errMsg = '';
    if(this.httpSubscription)
      this.httpSubscription.unsubscribe();
  }

  ngOnDestroy() {
    this.cleanUp();
  }

}
