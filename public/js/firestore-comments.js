import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
import { 
    getFirestore, collection, query, onSnapshot, doc, getDoc, addDoc, updateDoc, deleteField, orderBy, limit, serverTimestamp, increment, startAfter 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const db = getFirestore();
const postId = "postId123";

const commentsList = document.getElementById("commentsList");
const sortSelect = document.getElementById("sortSelect");
const loadMoreBtn = document.getElementById("loadMoreBtn");

let allComments = [];
let unsubscribe = null;
let visibleCount = 10; // awal tampil 10 komentar

// ---- LISTENER FIRESTORE ----
function listenComments() {
    if (unsubscribe) unsubscribe();

    const q = query(
        collection(db, "posts", postId, "comments"),
        orderBy("createdAt", "desc")
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
        allComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(0)
        }));

        renderComments();
    });
}

listenComments();

// ---- EVENT ----
sortSelect.addEventListener("change", () => {
    visibleCount = 10; // reset saat ganti urutan
    renderComments();
});

loadMoreBtn.addEventListener("click", () => {
    visibleCount += 10; // tambah 10 komentar
    renderComments();
});

// ---- RENDER KOMENTAR ----
function renderComments() {
    commentsList.innerHTML = "";

    let sorted = [];
    const mode = sortSelect.value;

    if (mode === "newest") {
        sorted = [...allComments].sort((a, b) => b.createdAt - a.createdAt);
    } else if (mode === "popular") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // komentar bulan ini
        const thisMonth = allComments.filter(c => c.createdAt >= startOfMonth);

        thisMonth.sort((a, b) => {
            if ((b.upVotes || 0) === (a.upVotes || 0)) {
                return b.createdAt - a.createdAt;
            }
            return (b.upVotes || 0) - (a.upVotes || 0);
        });

        const top5 = thisMonth.slice(0, 5);

        const rest = allComments
        .filter(c => !top5.includes(c))
        .sort((a, b) => {
            if ((b.upVotes || 0) === (a.upVotes || 0)) {
            return b.createdAt - a.createdAt;
            }
            return (b.upVotes || 0) - (a.upVotes || 0);
        });

        sorted = [...top5, ...rest];
    }

    // tampilkan sesuai visibleCount
    const limited = sorted.slice(0, visibleCount);

    limited.forEach(c => {
        const el = document.createElement("div");
        el.classList.add("comment-item");
        commentEl.innerHTML = `
        <div class="my-5 p-2 md:p-5 bg-white dark:bg-pasdev-surface-a00 shadow-md rounded-md">
            <div class="flex items-center mb-2">
                <span id="name" class="grow text-sm font-semibold text-dark dark:text-tertiary">${name}</span>
                <span id="date" class="shrink-0 text-[0.625rem] dark:text-white">${createdAt}</span>
            </div>
            <div class="msg-body p-2 text-sm font-medium dark:text-white bg-gray-100 dark:bg-pasdev-surface-a10 before:absolute before:content-[''] before:-top-2.5 before:left-0 before:border-[10px] before:border-transparent before:border-l-[10px] before:border-l-gray-100 dark:before:border-l-pasdev-surface-a10 rounded-md">
                ${comment}
            </div>
            <div class="msg-action flex gap-1.5 mt-1">
                <button  data-comment-id="${commentId}" data-vote-type="up" class="btn-comment action ${myVote === 'up' ? 'active' : ''} " onclick="voteComment(this)">
                    <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" width="16px" viewBox="0 -960 960 960">
                        <path d="M480-528 324-372q-11 11-28 11t-28-11q-11-11-11-28t11-28l184-184q12-12 28-12t28 12l184 184q11 11 11 28t-11 28q-11 11-28 11t-28-11L480-528Z"/>
                    </svg>
                    <span id="upVotesNum-${commentId}" class="text-xs font-medium">${upVotes}</span>
                </button>
                <button data-comment-id="${commentId}" data-vote-type="down" class="btn-comment action ${myVote === 'down' ? 'active' : ''}" onclick="voteComment(this)">
                    <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" width="16px" viewBox="0 -960 960 960">
                        <path d="M480-361q-8 0-15-2.5t-13-8.5L268-556q-11-11-11-28t11-28q11-11 28-11t28 11l156 156 156-156q11-11 28-11t28 11q11 11 11 28t-11 28L508-372q-6 6-13 8.5t-15 2.5Z"/>
                    </svg>
                    <span id="downVotesNum-${commentId}" class="text-xs font-medium">${downVotes}</span>
                </button>
                
                <button id="btn-action-${commentId}" data-dropdown-toggle="action[${i}]" data-dropdown-placement="right" class="flex items-center text-gray-400 hover:text-black dark:hover:text-white cursor-pointer" type="button">
                    <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" width="20px" viewBox="0 -960 960 960">
                        <path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/>
                    </svg>
                </button>
                <!-- Dropdown menu -->
                <div id="action[${i}]" class="z-40 hidden bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700">
                    <ul class="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="btn-action-${commentId}">
                        <li>
                            <a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Dashboard</a>
                        </li>
                        <li>
                            <a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Settings</a>
                        </li>
                        <li>
                            <a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Earnings</a>
                        </li>
                        <li>
                            <a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Sign out</a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        `;
        commentsList.appendChild(el);
    });

    // toggle tombol Load More
    if (visibleCount < sorted.length) {
        loadMoreBtn.style.display = "block";
    } else {
        loadMoreBtn.style.display = "none";
    }
}