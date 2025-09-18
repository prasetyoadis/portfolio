import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
import { 
    getFirestore, collection, query, onSnapshot, doc, getDoc, addDoc, updateDoc, deleteField, orderBy, limit, serverTimestamp, increment, startAfter 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCPvimYMvsBIXayvuhj1UA75njilp2OjDs",
    authDomain: "pasdev-35b47.firebaseapp.com",
    projectId: "pasdev-35b47",
    storageBucket: "pasdev-35b47.firebasestorage.app",
    messagingSenderId: "159673146420",
    appId: "1:159673146420:web:8f2a30a6328584fe067e61",
    measurementId: "G-5T7Z1CVRK6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function encodeKey(email) {
    return email.replace(/\./g, "_");
}

function decodeKey(key) {
    return key.replace(/_/g, ".");
}

// ID Post blog yang sedang dibuka (misalnya dari URL atau variabel global)
const postId = "B95f5zBVYNJfska8AuOA";
// Ambil email user tersimpan dari localStorage
let currentUserEmail = localStorage.getItem("userEmail") || null;

// Ambil referensi form
const commentForm = document.getElementById("comment-form");

commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Data dari form
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const comment = document.getElementById("comment").value;

    try {
        await addDoc(collection(db, "posts", postId, "comments"), {
            name,
            email,
            comment,
            createdAt: serverTimestamp(), // waktu server Firebase
            upVotes: 0,
            downVotes: 0,
            voters: {}
        });

        // simpan email ke localStorage agar bisa digunakan untuk vote
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userName", name);
        currentUserEmail = email;

        commentForm.reset();

        email.value = localStorage.getItem("userEmail");
        name.value = localStorage.getItem("userName");
    } catch (err) {
        console.error("Error menambahkan komentar: ", err);
    }
});

// Referensi elemen tempat komentar ditampilkan
const commentsSkeleton = document.getElementById("comments-skeleton");
const commentsList = document.getElementById("comments-list");
const btnShowMore = document.getElementById("btn-show-more");

const btnPopuler = document.querySelector('#dropdown-filter-comment ul li:nth-child(1) button:nth-child(1)')
const btnLatest = document.querySelector('#dropdown-filter-comment ul li:nth-child(2) button:nth-child(1)')
let unsubscribe = null; // simpan listener aktif

function loadComments(order = "popular") {
    // stop listener lama biar nggak double
    if (unsubscribe) unsubscribe();

    switch (order) {
        case "popular":
            if (btnPopuler.classList.contains('active')) {
                break;
            }
            else {
                btnPopuler.classList.toggle('active');
                btnLatest.classList.remove('active');
            }
            break;
        case "latest":
            if (btnLatest.classList.contains('active')) {
                break;
            }
            else {
                btnLatest.classList.toggle('active');
                btnPopuler.classList.remove('active');
            }
            break;
        default:
            btnPopuler.classList.remove('active');
            btnLatest.classList.remove('active');
            break;
    }
    
    let q;
    if (order === "latest") {
        // komentar terbaru
        q = query(
            collection(db, "posts", postId, "comments"),
            orderBy("createdAt", "desc"),
            limit(10)
        );
    } else {
        // komentar populer
        q = query(
            collection(db, "posts", postId, "comments"),
            orderBy("upVotes", "desc"),
            limit(10)
        );
    }

    let firstLoad = true; // untuk deteksi load pertama
    const renderedComments = new Set(); // simpan commentId yang sudah tampil
    const commentsSum = document.getElementById("comments-sum");

    // Real-time listener
    unsubscribe = onSnapshot(q, (snapshot) => {
    // --- Load pertama: tampilkan skeleton global ---
        if (firstLoad) {
            // tampilkan skeleton dulu
            commentsSkeleton.classList.remove("hidden");
            commentsList.classList.add("hidden");

            // Delay beberapa detik sebelum ganti skeleton dengan komentar asli
            setTimeout(() => {
                // reset sebelum render ulang
                commentsList.innerHTML = "";
                var i = 0;
                
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const commentId = doc.id;
                    const name = data.name || "Anonymous";
                    const upVotes = data.upVotes || "0";
                    const downVotes = data.downVotes || "0";
                    const comment = data.comment || "";
                    const createdAt = data.createdAt?.toDate().toLocaleString('id-ID', {day: "2-digit", month: "short", year: "numeric"}) || "-";
                    const voters = data.voters || {};

                    // cek apakah email user sudah vote
                    const myVote = currentUserEmail ? (voters[encodeKey(currentUserEmail)]) : null;
                
                    // Buat elemen komentar
                    const commentEl = document.createElement("div");
                    commentEl.classList.add("comment-item");
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

                    commentsList.appendChild(commentEl);
                    i++;
                    renderedComments.add(commentId);
                    commentsSum.innerHTML = renderedComments.size;
                });
                // setelah selesai render, sembunyikan skeleton & tampilkan komentar
                commentsSkeleton.classList.add("hidden");
                commentsList.classList.remove("hidden");
                btnShowMore.classList.remove("hidden");
                firstLoad = false;
            }, 3000); // delay 3 detik (bisa diganti 10000 untuk 10s)
        } else {
            // --- Update realtime setelah load pertama ---
            snapshot.docChanges().forEach((change) => {
                const doc = change.doc;
                const data = doc.data();
                const commentId = doc.id;
                const voters = data.voters || {};

                if (change.type === "added") {
                    let today = new Date().toLocaleDateString('id-ID', {day: "2-digit", month: "short", year: "numeric"});
                    
                    const name = data.name || "Anonymous";
                    const upVotes = data.upVotes || "0";
                    const downVotes = data.downVotes || "0";
                    const comment = data.comment || "";
                    const createdAt = data.createdAt?.toDate().toLocaleString('id-ID', {day: "2-digit", month: "short", year: "numeric"}) || today;

                    // cek apakah email user sudah vote
                    const myVote = currentUserEmail ? voters[encodeKey(currentUserEmail)] : null;

                    // jika komentar sudah pernah ditampilkan, skip
                    if (renderedComments.has(commentId)) return;

                    // buat skeleton kecil untuk komentar baru
                    const skeletonItem = document.createElement("div");
                    skeletonItem.classList.add("animate-pulse", "mb-4");
                    skeletonItem.innerHTML = `
                    <div class="my-5 p-2 md:p-5 bg-white dark:bg-pasdev-surface-a00 rounded-md shadow-md">
                        <div class="flex items-center mb-2">
                            <span id="name" class="grow text-sm font-semibold text-dark dark:text-tertiary">
                                <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"></div>
                            </span>
                            <span id="date" class="shrink-0 text-[0.625rem] dark:text-white">
                                <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-16"></div>
                            </span>
                        </div>
                        <div class="msg-body p-2 text-sm font-medium dark:text-white bg-gray-100 dark:bg-pasdev-surface-a10 before:absolute before:content-[''] before:-top-2.5 before:left-0 before:border-[10px] before:border-transparent before:border-l-[10px] before:border-l-gray-100 dark:before:border-l-pasdev-surface-a10 rounded-md">
                            <div class="h-2.5 bg-gray-400 rounded-full dark:bg-gray-700 w-full"></div>
                            <div class="h-2.5 mt-1.5 bg-gray-400 rounded-full dark:bg-gray-700 w-1/4"></div>
                        </div>
                        <div class="msg-action flex gap-1.5 mt-1">
                            <button class="flex items-center pl-0.5 py-1 pr-1.5 text-gray-400 dark:hover:text-white hover:text-black border border-transparent hover:border-gray-700 rounded-full cursor-pointer">
                                <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" width="16px" viewBox="0 -960 960 960">
                                    <path d="M480-528 324-372q-11 11-28 11t-28-11q-11-11-11-28t11-28l184-184q12-12 28-12t28 12l184 184q11 11 11 28t-11 28q-11 11-28 11t-28-11L480-528Z"/>
                                </svg>
                                <span class="text-xs font-medium">
                                    <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-4"></div>
                                </span>
                            </button>
                            <button class="flex items-center pl-0.5 py-1 pr-1.5 text-gray-400 dark:hover:text-white hover:text-black border border-transparent hover:border-gray-700 rounded-full cursor-pointer">
                                <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" width="16px" viewBox="0 -960 960 960">
                                    <path d="M480-361q-8 0-15-2.5t-13-8.5L268-556q-11-11-11-28t11-28q11-11 28-11t28 11l156 156 156-156q11-11 28-11t28 11q11 11 11 28t-11 28L508-372q-6 6-13 8.5t-15 2.5Z"/>
                                </svg>
                                <span class="text-xs font-medium">
                                    <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-4"></div>
                                </span>
                            </button>
                            
                            <button class="flex items-center text-gray-400 hover:text-black dark:hover:text-white cursor-pointer">
                                <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" width="20px" viewBox="0 -960 960 960">
                                    <path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    `;
                    commentsList.prepend(skeletonItem);
                    
                    // delay → ganti skeleton dengan komentar asli
                    setTimeout(() => {
                        const commentEl = document.createElement("div");
                        commentEl.classList.add("comment-item");
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
                                <button data-comment-id="${commentId}" data-vote-type="up" class="btn-comment action ${myVote === 'up' ? 'active' : ''}" onclick="voteComment(this)">
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
                                
                                <button class="flex items-center text-gray-400 hover:text-black dark:hover:text-white cursor-pointer">
                                    <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" width="20px" viewBox="0 -960 960 960">
                                        <path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        `;
                        skeletonItem.replaceWith(commentEl);
                        renderedComments.add(commentId);
                        commentsSum.innerHTML = renderedComments.size;
                    }, 5000); // delay skeleton untuk komentar baru
                }
                else if (change.type === "modified") {
                    // update hanya vote count yg berubah
                    const upEl = document.querySelector(`#upVotesNum-${commentId}`);
                    const downEl = document.querySelector(`#downVotesNum-${commentId}`);

                    // cek apakah email user sudah vote
                    const myVote = currentUserEmail ? voters[encodeKey(currentUserEmail)] : null;

                    console.log(myVote);

                    if (upEl) upEl.innerHTML = data.upVotes;
                    if (downEl) downEl.innerHTML = data.downVotes;

                    switch (myVote) {
                        case "up":
                            if (upEl.parentNode.classList.contains('active')) {
                                break;
                            }
                            else {
                                upEl.parentNode.classList.toggle('active');
                                downEl.parentNode.classList.remove('active');
                            }
                            break;
                        case "down":
                            if (downEl.parentNode.classList.contains('active')) {
                                break;
                            }
                            else {
                                downEl.parentNode.classList.toggle('active');
                                upEl.parentNode.classList.remove('active');
                            }
                            break;
                        default:
                            downEl.parentNode.classList.remove('active');
                            upEl.parentNode.classList.remove('active');
                            break;
                    }

                }
            });
        }
    });
}

// Panggil awal default ke populer
loadComments("popular");

// Fungsi vote
window.voteComment = async (btn) => {
    const commentId = btn.getAttribute("data-comment-id");
    const voteType = btn.getAttribute("data-vote-type");

    if (!currentUserEmail) {
        alert("posting komentar terlebih dahulu untuk bisa vote!");
        return;
    }

    const ref = doc(db, "posts", postId, "comments", commentId);
    const res = await getDoc(ref);
    const data = res.data();
    const voters = data.voters || {};
    const myVote = voters[encodeKey(currentUserEmail)] || null;
    const safeEmail = encodeKey(currentUserEmail);

    let updateData = {};

    if (myVote === voteType) {
        // klik ulang → batal
        updateData[voteType === "up" ? "upVotes" : "downVotes"] = increment(-1);
        updateData[`voters.${safeEmail}`] = deleteField();
    } else {
        // kalau sebelumnya sudah vote lawan → kurangi dulu
        if (myVote) {
            updateData[myVote === "up" ? "upVotes" : "downVotes"] = increment(-1);
        }
        // tambahkan vote baru (langsung string "up" / "down")
        updateData[voteType === "up" ? "upVotes" : "downVotes"] = increment(1);
        updateData[`voters.${safeEmail}`] = voteType;
    }

    await updateDoc(ref, updateData);
};

// Hubungkan dengan tombol dropdown
btnPopuler.addEventListener("click", () => loadComments("popular"));
btnLatest.addEventListener("click", () => loadComments("latest"));