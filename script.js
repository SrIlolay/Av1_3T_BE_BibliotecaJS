// Armazenamento de dados
let books = JSON.parse(localStorage.getItem('libraryBooks')) || [];
let borrowedBooks = JSON.parse(localStorage.getItem('borrowedBooks')) || [];

// Funções de gerenciamento de livros
function addBook(title, author, isbn) {
    const newBook = {
        id: Date.now(),
        title,
        author,
        isbn,
        available: true
    };
    
    books.push(newBook);
    saveBooks();
    return newBook;
}

function findAllBooks() {
    return books;
}

function findBookByTitle(title) {
    return books.filter(book => 
        book.title.toLowerCase().includes(title.toLowerCase())
    );
}

function findBookByAuthor(author) {
    return books.filter(book => 
        book.author.toLowerCase().includes(author.toLowerCase())
    );
}

function findBookByIsbn(isbn) {
    return books.filter(book => 
        book.isbn.toLowerCase().includes(isbn.toLowerCase())
    );
}

function borrowBook(isbn, borrowerName) {
    const bookIndex = books.findIndex(book => 
        book.isbn === isbn && book.available
    );
    
    if (bookIndex === -1) {
        return false;
    }
    
    books[bookIndex].available = false;
    
    const borrowedBook = {
        ...books[bookIndex],
        borrowerName,
        borrowDate: new Date().toISOString()
    };
    
    borrowedBooks.push(borrowedBook);
    saveBooks();
    saveBorrowedBooks();
    
    return borrowedBook;
}

function returnBook(isbn) {
    const borrowedIndex = borrowedBooks.findIndex(book => book.isbn === isbn);
    
    if (borrowedIndex === -1) {
        return false;
    }
    
    const bookIndex = books.findIndex(book => book.isbn === isbn);
    if (bookIndex !== -1) {
        books[bookIndex].available = true;
    }
    
    borrowedBooks.splice(borrowedIndex, 1);
    saveBooks();
    saveBorrowedBooks();
    
    return true;
}

function findAllBorrowedBooks() {
    return borrowedBooks;
}

// Funções de persistência
function saveBooks() {
    localStorage.setItem('libraryBooks', JSON.stringify(books));
}

function saveBorrowedBooks() {
    localStorage.setItem('borrowedBooks', JSON.stringify(borrowedBooks));
}

// Manipulação da interface
document.addEventListener('DOMContentLoaded', function() {
    // Navegação entre páginas
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.sidebar button');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetPage = this.id.replace('btn-', 'page-');
            
            // Atualizar botões ativos
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar página alvo
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetPage).classList.add('active');
            
            // Atualizar dados se necessário
            if (targetPage === 'page-list-books') {
                displayAllBooks();
            } else if (targetPage === 'page-list-borrowed') {
                displayBorrowedBooks();
            }
        });
    });
    
    // Adicionar livro
    document.getElementById('add-book-btn').addEventListener('click', function() {
        const title = document.getElementById('book-title').value;
        const author = document.getElementById('book-author').value;
        const isbn = document.getElementById('book-isbn').value;
        
        if (title && author && isbn) {
            addBook(title, author, isbn);
            showMessage('add-book-message', 'Livro adicionado com sucesso!', 'success');
            
            // Limpar formulário
            document.getElementById('book-title').value = '';
            document.getElementById('book-author').value = '';
            document.getElementById('book-isbn').value = '';
        } else {
            showMessage('add-book-message', 'Por favor, preencha todos os campos.', 'error');
        }
    });
    
    // Buscar livro
    document.getElementById('search-book-btn').addEventListener('click', function() {
        const searchTerm = document.getElementById('search-term').value;
        
        if (searchTerm) {
            const byTitle = findBookByTitle(searchTerm);
            const byAuthor = findBookByAuthor(searchTerm);
            const byIsbn = findBookByIsbn(searchTerm);
            
            // Combinar resultados únicos
            const allResults = [...byTitle, ...byAuthor, ...byIsbn];
            const uniqueResults = allResults.filter((book, index, self) => 
                index === self.findIndex(b => b.id === book.id)
            );
            
            displaySearchResults(uniqueResults);
        } else {
            showMessage('search-results', 'Por favor, digite um termo de busca.', 'error');
        }
    });
    
    // Emprestar livro
    document.getElementById('borrow-book-btn').addEventListener('click', function() {
        const isbn = document.getElementById('borrow-isbn').value;
        const borrowerName = document.getElementById('borrower-name').value;
        
        if (isbn && borrowerName) {
            const result = borrowBook(isbn, borrowerName);
            
            if (result) {
                showMessage('borrow-message', `Livro emprestado para ${borrowerName}.`, 'success');
                
                // Limpar formulário
                document.getElementById('borrow-isbn').value = '';
                document.getElementById('borrower-name').value = '';
            } else {
                showMessage('borrow-message', 'Livro não encontrado ou já emprestado.', 'error');
            }
        } else {
            showMessage('borrow-message', 'Por favor, preencha todos os campos.', 'error');
        }
    });
    
    // Devolver livro
    document.getElementById('return-book-btn').addEventListener('click', function() {
        const isbn = document.getElementById('return-isbn').value;
        
        if (isbn) {
            const result = returnBook(isbn);
            
            if (result) {
                showMessage('return-message', 'Livro devolvido com sucesso.', 'success');
                document.getElementById('return-isbn').value = '';
            } else {
                showMessage('return-message', 'Este livro não consta como emprestado.', 'error');
            }
        } else {
            showMessage('return-message', 'Por favor, informe o ISBN do livro.', 'error');
        }
    });
    
    // Funções auxiliares de exibição
    function displayAllBooks() {
        const booksList = document.getElementById('books-list');
        const allBooks = findAllBooks();
        
        booksList.innerHTML = '';
        
        allBooks.forEach(book => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.isbn}</td>
                <td>${book.available ? 'Disponível' : 'Emprestado'}</td>
            `;
            booksList.appendChild(row);
        });
    }
    
    function displaySearchResults(results) {
        const resultsContainer = document.getElementById('search-results');
        
        if (results.length > 0) {
            let html = '<h3>Resultados da busca:</h3><table><thead><tr><th>Título</th><th>Autor</th><th>ISBN</th><th>Status</th></tr></thead><tbody>';
            
            results.forEach(book => {
                html += `
                    <tr>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td>${book.isbn}</td>
                        <td>${book.available ? 'Disponível' : 'Emprestado'}</td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            resultsContainer.innerHTML = html;
        } else {
            resultsContainer.innerHTML = '<p class="alert alert-error">Nenhum livro encontrado.</p>';
        }
    }
    
    function displayBorrowedBooks() {
        const borrowedList = document.getElementById('borrowed-list');
        const allBorrowed = findAllBorrowedBooks();
        
        borrowedList.innerHTML = '';
        
        allBorrowed.forEach(book => {
            const borrowDate = new Date(book.borrowDate).toLocaleDateString('pt-BR');
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.isbn}</td>
                <td>${book.borrowerName}</td>
                <td>${borrowDate}</td>
            `;
            borrowedList.appendChild(row);
        });
    }
    
    function showMessage(containerId, message, type) {
        const container = document.getElementById(containerId);
        container.innerHTML = `<p class="alert alert-${type}">${message}</p>`;
        
        // Limpar mensagem após 3 segundos
        setTimeout(() => {
            container.innerHTML = '';
        }, 3000);
    }
    
    // Inicializar exibição de livros se houver dados
    if (books.length > 0) {
        displayAllBooks();
    }
    
    if (borrowedBooks.length > 0) {
        displayBorrowedBooks();
    }
});