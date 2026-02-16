/* ============================================================
   Web Genius — Interactive Scripts + i18n
   ============================================================ */

/* ----------------------------------------------------------
   TRANSLATIONS
   ---------------------------------------------------------- */
const i18n = {
    en: {
        // Nav
        'nav.programs': 'Programs',
        'nav.curriculum': 'Curriculum',
        'nav.reviews': 'Reviews',
        'nav.pricing': 'Pricing',
        'nav.cta': 'Join Live Academy',

        // Hero
        'hero.badge': '🚀 Now enrolling — Spring 2026 Cohort',
        'hero.headline': 'Turn Screen Time into <span class="gradient-text">Superpowers.</span>',
        'hero.sub': "The world's first AI & Coding academy for kids. Start learning today; master the future in our Live Academy.",
        'hero.cta_primary': 'Join the Live Academy →',
        'hero.cta_secondary': 'Explore Self-Paced Courses',
        'hero.float1': '🤖 AI & Machine Learning',
        'hero.float2': '🎨 Creative Coding',
        'hero.float3': '🚀 Build Real Apps',

        // Problem / Solution
        'ps.problem_title': 'Schools are teaching 2010 skills.',
        'ps.problem_desc': "Outdated curricula leave kids unprepared for the AI-powered economy they'll inherit.",
        'ps.solution_title': 'Web Genius teaches 2030 skills.',
        'ps.solution_desc': 'Generative AI (Gemini / ChatGPT), Python programming, and Digital Ethics — the skills that matter.',

        // Two Paths
        'paths.title': 'Choose Your Path',
        'paths.subtitle': 'Whether your child is just curious or ready to commit, we have the right program.',
        'paths.explorer.title': 'Self-Paced Course',
        'paths.explorer.subtitle': 'Video library for independent learners.',
        'paths.explorer.f1': 'Access to full video library',
        'paths.explorer.f2': 'Basic quizzes & challenges',
        'paths.explorer.f3': 'Learn at your own speed',
        'paths.explorer.f4': 'Community forum access',
        'paths.explorer.price': '$149 <span>one-time</span>',
        'paths.explorer.cta': 'Get Started →',
        'paths.creator.badge': '⭐ Most Popular',
        'paths.creator.title': 'Live Academy',
        'paths.creator.subtitle': '3-month intensive size cohort with mentors.',
        'paths.creator.f1': '3-Month Intensive Cohort',
        'paths.creator.f2': 'Live Weekly Mentorship',
        'paths.creator.f3': 'Build a Real Portfolio (Video Games, Movies, Apps)',
        'paths.creator.f4': 'Certified Diploma',
        'paths.creator.f5': 'Priority support & grading',
        'paths.creator.price': '$750 <span>/ 3 months</span>',
        'paths.creator.cta': 'Apply Now (Limited Spots)',
        'paths.recurring.title': 'Creators Club',
        'paths.recurring.subtitle': 'Weekly sessions for graduates to keep building.',
        'paths.recurring.prereq': '⚠️ Only for Live Academy graduates',
        'paths.recurring.f1': 'Weekly 60-90 min sessions',
        'paths.recurring.f2': 'Advanced projects & challenges',
        'paths.recurring.f3': 'Join anytime (if seats available)',
        'paths.recurring.f4': 'Pay per month or semester',
        'paths.recurring.price': '€120 <span>/ month</span>',
        'paths.recurring.cta': 'Join the Club',

        // Curriculum
        'curriculum.title': 'The 3-Month Journey',
        'curriculum.subtitle': 'A carefully crafted curriculum that turns beginners into creators.',
        'curriculum.m1.title': 'AI Art & Storytelling',
        'curriculum.m1.desc': 'Learn how to prompt AI image generators, create illustrated stories, and explore the ethics of AI-generated content.',
        'curriculum.m1.label': 'Month One',
        'curriculum.m2.title': 'Video & Audio Production',
        'curriculum.m2.desc': 'Create animated shorts with AI voice-overs, edit videos, and produce original audio content using cutting-edge tools.',
        'curriculum.m2.label': 'Month Two',
        'curriculum.m3.title': 'Coding & Game Assets',
        'curriculum.m3.desc': 'Write real Python code, design web pages, and build game assets for a final portfolio project that wows.',
        'curriculum.m3.label': 'Month Three',

        // Social Proof
        'social.title': 'Loved by Parents & Kids',
        'social.subtitle': 'See what families are saying about the Web Genius experience.',
        'social.r1.text': '"My daughter went from watching YouTube all day to <strong>building her own games</strong>. The mentors are incredible and she\'s so proud of her portfolio."',
        'social.r1.role': 'Parent, Austin TX',
        'social.r2.text': '"Finally an academy that teaches kids <strong>real-world AI skills</strong>, not just baby coding games. Worth every penny."',
        'social.r2.role': 'Parent, Vilnius LT',
        'social.r3.text': '"My son loved the live sessions. He now <strong>explains AI to me</strong> at the dinner table. Best investment in his future."',
        'social.r3.role': 'Parent, Chicago IL',
        'social.safety_title': 'Safety First — Always',
        'social.safety_desc': 'GDPR & COPPA compliant. All AI tools are used in supervised, age-appropriate environments with strict content filters.',

        // CTA Banner
        'cta.title': 'Ready to Give Your Child a Head Start?',
        'cta.desc': 'Join hundreds of families building the next generation of creators, thinkers, and innovators.',
        'cta.btn': 'Apply to the Live Academy →',

        // Footer
        'footer.brand_desc': 'Empowering the next generation with AI & coding skills. Built by educators, loved by families.',
        'footer.platform': 'Platform',
        'footer.student_login': 'Student Login',
        'footer.parent_portal': 'Parent Portal',
        'footer.syllabus': 'Syllabus',
        'footer.pricing': 'Pricing',
        'footer.programs': 'Programs',
        'footer.self_paced': 'Self-Paced Library',
        'footer.live_academy': 'Live Academy',
        'footer.curriculum': 'Curriculum',
        'footer.faq': 'FAQ',
        'footer.legal': 'Legal',
        'footer.privacy': 'Privacy Policy',
        'footer.terms': 'Terms of Service',
        'footer.cookies': 'Cookie Policy',

        // Modal
        'modal.title': 'Join the Live Academy',
        'modal.subtitle': 'Secure your spot in the next cohort.',
        'modal.email_label': 'Your Email Address',
        'modal.cohort_label': 'Select Cohort',
        'modal.select_placeholder': 'Loading cohorts...',
        'modal.submit_btn': 'Complete Registration',
        'modal.footer_text': "We'll send next steps to your email. No payment required today.",
        'modal.success': 'Registration successful! Check your email.',
        'modal.error': 'Something went wrong. Please try again.',

        // Syllabus Page
        'syllabus.title': 'Detailed <span class="gradient-text">Syllabus</span>',
        'syllabus.subtitle': 'A week-by-week breakdown of our 3-month Live Academy program. Designed to take students from beginners to published creators.',
        'syllabus.m1.title': 'Month 1: AI Art & Storytelling',
        'syllabus.w1.title': 'Week 1: Introduction to Generative AI',
        'syllabus.w1.desc': 'Understanding how LLMs and Image Generators work. Safety, ethics, and "prompt engineering" basics using Gemini and Midjourney.',
        'syllabus.w2.title': 'Week 2: Character Design & Consistency',
        'syllabus.w2.desc': 'Creating consistent characters for stories. Learning seed numbers, style references, and remixing.',
        'syllabus.w3.title': 'Week 3: World Building & Environments',
        'syllabus.w3.desc': 'Generating landscapes, interiors, and consistent settings for your game or movie concepts.',
        'syllabus.w4.title': 'Week 4: Project 1 — The Graphic Novel',
        'syllabus.w4.desc': '<strong>Deliverable:</strong> Create a 5-page digital comic book using AI-generated art and story assistance.',
        'syllabus.m2.title': 'Month 2: Video, Audio & Animation',
        'syllabus.w5.title': 'Week 5: AI Voice & Sound Design',
        'syllabus.w5.desc': ' cloning voices (ethically), generating sound effects, and composing background music with AI tools.',
        'syllabus.w6.title': 'Week 6: Image to Video Animation',
        'syllabus.w6.desc': 'Bringing static characters to life. Lip-syncing and basic motion animation.',
        'syllabus.w7.title': 'Week 7: Video Editing Fundamentals',
        'syllabus.w7.desc': 'Using CapCut / Premiere to assemble clips, add transitions, and sync audio.',
        'syllabus.w8.title': 'Week 8: Project 2 — The Movie Trailer',
        'syllabus.w8.desc': '<strong>Deliverable:</strong> Produce a 60-second trailer for your story concept using animated AI assets.',
        'syllabus.m3.title': 'Month 3: Coding & Portfolio',
        'syllabus.w9.title': 'Week 9: Python Basics for AI',
        'syllabus.w9.desc': 'Variables, loops, and functions. Using the OpenAI API to build a simple chatbot.',
        'syllabus.w10.title': 'Week 10: Web Basics (HTML/CSS)',
        'syllabus.w10.desc': 'Building a personal portfolio website to showcase your work.',
        'syllabus.w11.title': 'Week 11: Integrating AI into Code',
        'syllabus.w11.desc': 'Building a simple web game (e.g., "Choose Your Own Adventure") powered by AI logic.',
        'syllabus.w12.title': 'Week 12: Final Demo Day',
        'syllabus.w12.desc': '<strong>Deliverable:</strong> Present your final portfolio website and live project to parents and peers.',

        // FAQ Page
        'faq.title': 'Frequently Asked <span class="gradient-text">Questions</span>',
        'faq.subtitle': 'Everything you need to know about our programs, cohorts, and safety policies.',
        'faq.q1': 'What age group is this program for?',
        'faq.a1': 'Web Genius is specifically designed for children ages 10-16. Our curriculum is adapted to be engaging and safe for this age group, balancing fun creativity with technical skills.',
        'faq.q2': 'Do we need a powerful computer?',
        'faq.a2': 'Not necessarily! Most of our tools run in the cloud (web browser). A standard laptop (Windows, Mac, or Chromebook) released in the last 4-5 years is sufficient. Tablets are okay for watching lessons but a keyboard/mouse is required for the coding and editing portions.',
        'faq.q3': 'Is the AI content safe for kids?',
        'faq.a3': 'Absolutely. Safety is our #1 priority. We use filtered versions of AI tools and teach students specifically about digital safety, data privacy, and ethical use of AI. All live interactions are moderated by trained educators.',
        'faq.q4': 'What happens if we miss a live session?',
        'faq.a4': 'All live mentorship sessions are recorded and made available in the Student Portal within 24 hours. Your child can watch the replay and submit questions to their mentor via the platform.',
        'faq.q5': 'What is your refund policy?',
        'faq.a5': 'We offer a "Satisfaction Guarantee." If you are not happy with the program within the first 14 days of the cohort start date, let us know and we will issue a full refund, no questions asked.',
        'faq.q6': 'Does my child get a certificate?',
        'faq.a6': 'Yes! Upon successful completion of the 3-month Live Academy and submission of the final portfolio project, students receive a verified digital diploma from Web Genius.',

        // Legal Pages (General)
        'legal.privacy_title': 'Privacy Policy',
        'legal.last_updated': 'Last Updated: February 2026',
        'legal.terms_title': 'Terms of Service',
        'legal.cookies_title': 'Cookie Policy',

        // Privacy Content
        'privacy.intro_title': '1. Introduction',
        'privacy.intro_text': 'Web Genius ("we," "our," or "us") is committed to protecting the privacy of our students (children) and their parents. This Privacy Policy explains how we collect, use, and safeguard your information.',
        'privacy.collect_title': '2. Information We Collect',
        'privacy.collect_text': 'We collect only the minimum information necessary to provide our educational services:',
        'privacy.collect_list1': '<strong>Parent Information:</strong> Name, email address, and payment information (processed via secure third-party providers).',
        'privacy.collect_list2': '<strong>Student Information:</strong> First name, age, and projects created within the platform. We do not collect precise geolocation or biometric data.',
        'privacy.child_title': '3. Children\'s Privacy (COPPA & GDPR)',
        'privacy.child_text': 'We strictly adhere to the Children\'s Online Privacy Protection Act (COPPA) and GDPR for children:',
        'privacy.child_list1': 'We require verifiable parental consent before collecting any personal information from a child under 13.',
        'privacy.child_list2': 'We do not sell student data to third parties.',
        'privacy.child_list3': 'We do not display targeted advertising to students.',
        'privacy.use_title': '4. How We Use Information',
        'privacy.use_text': 'We use your data to:',
        'privacy.use_list1': 'Facilitate the online learning course.',
        'privacy.use_list2': 'Track student progress and issue diplomas.',
        'privacy.use_list3': 'Communicate with parents regarding cohort schedules and account updates.',
        'privacy.sec_title': '5. Data Security',
        'privacy.sec_text': 'We implement industry-standard encryption and security measures to protect your data stored on our servers (via Supabase). However, no method of transmission over the internet is 100% secure.',
        'privacy.contact_title': '6. Contact Us',
        'privacy.contact_text': 'If you have questions about this policy, please contact us at <a href="mailto:privacy@webgenius.com" style="color:var(--blue)">privacy@webgenius.com</a>.',

        // Terms Content
        'terms.accept_title': '1. Acceptance of Terms',
        'terms.accept_text': 'By accessing or using the Web Genius platform, you agree to these Terms of Service. If you are a parent or guardian, you agree to these terms on behalf of your child using the platform.',
        'terms.edu_title': '2. Educational Services',
        'terms.edu_text': 'Web Genius provides online courses, mentorship, and educational content. We reserve the right to modify the curriculum, schedule, or platform features at any time to improve the educational experience.',
        'terms.code_title': '3. Code of Conduct',
        'terms.code_text': 'We foster a safe and positive learning environment. Students are expected to:',
        'terms.code_list1': 'Treat mentors and peers with respect.',
        'terms.code_list2': 'Not share inappropriate content or language.',
        'terms.code_list3': 'Not share personal contact information with other students.',
        'terms.code_violation': 'Violation of these rules may result in suspension from the program without refund.',
        'terms.pay_title': '4. Payments and Refunds',
        'terms.pay_text': 'Tuition fees are due upon registration. We offer a 14-day satisfaction guarantee for full refunds. After 14 days, refunds are not typically provided except in extenuating circumstances.',
        'terms.ip_title': '5. Intellectual Property',
        'terms.ip_text': 'Students retain ownership of the projects (games, stories, code) they create. Web Genius retains ownership of the course materials, videos, and platform code.',
        'terms.liab_title': '6. Limitation of Liability',
        'terms.liab_text': 'Web Genius is an educational tool. We are not responsible for how students use the skills learned outside of our platform.',

        // Cookies Content
        'cookies.what_title': '1. What Are Cookies?',
        'cookies.what_text': 'Cookies are small text files stored on your device when you visit a website. They help the website function correctly and remember your preferences.',
        'cookies.use_title': '2. How We Use Cookies',
        'cookies.use_text': 'Web Genius uses cookies for the following purposes:',
        'cookies.use_list1': '<strong>Essential Cookies:</strong> Required for the website to function (e.g., logging into the Student/Parent portal, processing payments).',
        'cookies.use_list2': '<strong>Preference Cookies:</strong> Remembering your language setting (EN/LT).',
        'cookies.use_list3': '<strong>Analytics Cookies:</strong> We use minimal analytics to see which pages are most popular. We do NOT track individual student browsing habits for advertising.',
        'cookies.manage_title': '3. Managing Cookies',
        'cookies.manage_text': 'You can control specific cookie preferences in your browser settings. However, disabling essential cookies may prevent you from logging into your account.',
        'cookies.update_title': '4. Updates',
        'cookies.update_text': 'We may update this policy from time to time. Please check back regularly for any changes.',
    },

    lt: {
        // Nav
        'nav.programs': 'Programos',
        'nav.curriculum': 'Mokymo planas',
        'nav.reviews': 'Atsiliepimai',
        'nav.pricing': 'Kainos',
        'nav.cta': 'Prisijunk prie akademijos',

        // Hero
        'hero.badge': '🚀 Registracija atvira — 2026 m. pavasario grupė',
        'hero.headline': 'Paversk ekrano laiką <span class="gradient-text">supergaliomis.</span>',
        'hero.sub': 'Pirmoji pasaulyje AI ir programavimo akademija vaikams. Pradėk mokytis šiandien; įvaldyk ateitį mūsų gyvoje akademijoje.',
        'hero.cta_primary': 'Prisijunk prie akademijos →',
        'hero.cta_secondary': 'Savarankiški kursai',
        'hero.float1': '🤖 AI ir mašininis mokymas',
        'hero.float2': '🎨 Kūrybinis programavimas',
        'hero.float3': '🚀 Kurk tikras programėles',

        // Problem / Solution
        'ps.problem_title': 'Mokyklos moko 2010-ųjų įgūdžių.',
        'ps.problem_desc': 'Pasenusios programos neparuošia vaikų AI valdomai ekonomikai, kurioje jie gyvens.',
        'ps.solution_title': 'Web Genius moko 2030-ųjų įgūdžių.',
        'ps.solution_desc': 'Generatyvinis AI (Gemini / ChatGPT), Python programavimas ir skaitmeninė etika — įgūdžiai, kurie svarbūs.',

        // Two Paths
        'paths.title': 'Pasirink savo kelią',
        'paths.subtitle': 'Nesvarbu, ar jūsų vaikas tik smalsuolis, ar pasiruošęs rimtam žingsniui — turime tinkamą programą.',
        'paths.explorer.title': 'Savarankiški Kursai',
        'paths.explorer.subtitle': 'Video biblioteka savarankiškam mokymuisi.',
        'paths.explorer.f1': 'Prieiga prie visų video pamokų',
        'paths.explorer.f2': 'Pagrindiniai testai ir užduotys',
        'paths.explorer.f3': 'Mokykis savo tempu',
        'paths.explorer.f4': 'Prieiga prie bendruomenės forumo',
        'paths.explorer.price': '€99 <span>vienkartinis mokestis</span>',
        'paths.explorer.cta': 'Pradėti →',
        'paths.creator.badge': '⭐ Populiariausia',
        'paths.creator.title': 'Gyva Akademija',
        'paths.creator.subtitle': '3 mėnesių intensyvi programa su mentoriais.',
        'paths.creator.f1': '3 mėnesių intensyvus kursas',
        'paths.creator.f2': 'Savaitinės gyvos mentorystės sesijos',
        'paths.creator.f3': 'Sukurk tikrą portfolio (žaidimus, filmus, programėles)',
        'paths.creator.f4': 'Sertifikuotas diplomas',
        'paths.creator.f5': 'Prioritetinė pagalba ir vertinimas',
        'paths.creator.price': '€360 <span>už 3 mėnesius</span>',
        'paths.creator.cta': 'Registruotis (Ribotos vietos)',
        'paths.recurring.title': 'Kūrėjų Klubas (Būrelis)',
        'paths.recurring.subtitle': 'Savaitiniai užsiėmimai baigusiems akademiją.',
        'paths.recurring.prereq': '⚠️ Tik po Gyvosios Akademijos',
        'paths.recurring.f1': 'Savaitiniai 60-90 min užsiėmimai',
        'paths.recurring.f2': 'Pažengusiųjų projektai ir iššūkiai',
        'paths.recurring.f3': 'Prisijunk bet kada (jei yra vietų)',
        'paths.recurring.f4': 'Mokėk už mėnesį arba semestrą',
        'paths.recurring.price': '€120 <span>/ mėn</span>',
        'paths.recurring.cta': 'Prisijungti prie Klubo',

        // Curriculum
        'curriculum.title': '3 mėnesių kelionė',
        'curriculum.subtitle': 'Kruopščiai sukurta programa, kuri iš pradedančiųjų paruošia kūrėjus.',
        'curriculum.m1.title': 'AI menas ir pasakojimai',
        'curriculum.m1.desc': 'Išmok naudoti AI paveikslų generatorius, kurti iliustruotas istorijas ir nagrinėti AI turinio etiką.',
        'curriculum.m1.label': 'Pirmas mėnuo',
        'curriculum.m2.title': 'Video ir garso gamyba',
        'curriculum.m2.desc': 'Kurk animacinius trumpametražius su AI balso įrašais, redaguok vaizdo įrašus ir gamink originalų garso turinį.',
        'curriculum.m2.label': 'Antras mėnuo',
        'curriculum.m3.title': 'Programavimas ir žaidimų kūrimas',
        'curriculum.m3.desc': 'Rašyk tikrą Python kodą, projektuok tinklalapius ir kurk žaidimų elementus galutiniam portfolio projektui.',
        'curriculum.m3.label': 'Trečias mėnuo',

        // Social Proof
        'social.title': 'Tėvų ir vaikų mėgstama',
        'social.subtitle': 'Pažiūrėkite, ką šeimos sako apie Web Genius patirtį.',
        'social.r1.text': '„Mano dukra nustojo visą dieną žiūrėti YouTube ir pradėjo <strong>kurti savo žaidimus</strong>. Mentoriai nuostabūs, o ji labai didžiuojasi savo portfolio."',
        'social.r1.role': 'Tėvai, Austin TX',
        'social.r2.text': '„Pagaliau akademija, kuri moko vaikus <strong>realaus pasaulio AI įgūdžių</strong>, o ne tik vaikiškų programavimo žaidimų. Verta kiekvieno cento."',
        'social.r2.role': 'Tėvai, Vilnius LT',
        'social.r3.text': '„Mano sūnus mylėjo gyvas sesijas. Dabar jis <strong>man aiškina apie AI</strong> prie vakarienės stalo. Geriausia investicija į jo ateitį."',
        'social.r3.role': 'Tėvai, Chicago IL',
        'social.safety_title': 'Svarbiausia — saugumas',
        'social.safety_desc': 'BDAR ir COPPA atitiktis. Visi AI įrankiai naudojami prižiūrimoje, amžiui tinkamoje aplinkoje su griežtais turinio filtrais.',

        // CTA Banner
        'cta.title': 'Pasiruošę suteikti vaikui pranašumą?',
        'cta.desc': 'Prisijunkite prie šimtų šeimų, kuriančių naująją kūrėjų, mąstytojų ir novatorių kartą.',
        'cta.btn': 'Registruotis į akademiją →',

        // Footer
        'footer.brand_desc': 'Įgaliname naująją kartą AI ir programavimo įgūdžiais. Sukurta pedagogų, mylima šeimų.',
        'footer.platform': 'Platforma',
        'footer.student_login': 'Mokinio prisijungimas',
        'footer.parent_portal': 'Tėvų portalas',
        'footer.syllabus': 'Mokymo planas',
        'footer.pricing': 'Kainos',
        'footer.programs': 'Programos',
        'footer.self_paced': 'Savarankiška biblioteka',
        'footer.live_academy': 'Gyva akademija',
        'footer.curriculum': 'Programa',
        'footer.faq': 'DUK',
        'footer.legal': 'Teisinė informacija',
        'footer.privacy': 'Privatumo politika',
        'footer.terms': 'Paslaugų sąlygos',
        'footer.cookies': 'Slapukų politika',

        // Modal
        'modal.title': 'Prisijunk prie Gyvosios Akademijos',
        'modal.subtitle': 'Užsitikrink vietą kitoje grupėje.',
        'modal.email_label': 'Jūsų el. pašto adresas',
        'modal.cohort_label': 'Pasirinkite grupę',
        'modal.select_placeholder': 'Kraunamos grupės...',
        'modal.submit_btn': 'Baigti registraciją',
        'modal.footer_text': 'Atsiųsime tolimesnius žingsnius el. paštu. Šiandien mokėti nereikia.',
        'modal.success': 'Registracija sėkminga! Patikrinkite el. paštą.',
        'modal.error': 'Įvyko klaida. Bandykite dar kartą.',

        // Syllabus Page
        'syllabus.title': 'Išsami <span class="gradient-text">Programa</span>',
        'syllabus.subtitle': 'Mūsų 3 mėnesių Gyvosios Akademijos savaitinė apžvalga. Sukurta taip, kad pradedančiuosius paverstų publikuojamais kūrėjais.',
        'syllabus.m1.title': '1 Mėnuo: AI Menas ir Istorijų Kūrimas',
        'syllabus.w1.title': '1 Savaitė: Įvadas į Generatyvinį AI',
        'syllabus.w1.desc': 'Supratimas, kaip veikia LLM ir vaizdų generatoriai. Saugumas, etika ir „prompt engineering“ pagrindai naudojant Gemini ir Midjourney.',
        'syllabus.w2.title': '2 Savaitė: Veikėjų Kūrimas ir Nuoseklumas',
        'syllabus.w2.desc': 'Nuoseklių veikėjų kūrimas istorijoms. Sėklų (seed) numerių, stiliaus nuorodų ir remiksavimo mokymasis.',
        'syllabus.w3.title': '3 Savaitė: Pasaulių Kūrimas ir Aplinka',
        'syllabus.w3.desc': 'Peizažų, interjerų ir nuoseklių aplinkų generavimas jūsų žaidimų ar filmų koncepcijoms.',
        'syllabus.w4.title': '4 Savaitė: 1 Projektas — Grafinė Novelė',
        'syllabus.w4.desc': '<strong>Rezultatas:</strong> Sukurti 5 puslapių skaitmeninę komiksų knygą naudojant AI sugeneruotą meną ir istorijos pagalbą.',
        'syllabus.m2.title': '2 Mėnuo: Video, Garso ir Animacijos Gamyba',
        'syllabus.w5.title': '5 Savaitė: AI Balsas ir Garso Dizainas',
        'syllabus.w5.desc': 'Balsų klonavimas (etiškai), garso efektų generavimas ir foninės muzikos kūrimas su AI įrankiais.',
        'syllabus.w6.title': '6 Savaitė: Paveikslėlių Animavimas į Video',
        'syllabus.w6.desc': 'Statinių veikėjų atgaivinimas. Lūpų sinchronizavimas ir bazinė judesių animacija.',
        'syllabus.w7.title': '7 Savaitė: Video Montavimo Pagrindai',
        'syllabus.w7.desc': 'Naudojant CapCut / Premiere klipų sujungimui, perėjimų pridėjimui ir garso sinchronizavimui.',
        'syllabus.w8.title': '8 Savaitė: 2 Projektas — Filmo Treileris',
        'syllabus.w8.desc': '<strong>Rezultatas:</strong> Sukurti 60 sekundžių treilerį jūsų istorijos koncepcijai naudojant animuotus AI aktyvus.',
        'syllabus.m3.title': '3 Mėnuo: Programavimas ir Portfolio',
        'syllabus.w9.title': '9 Savaitė: Python Pagrindai AI',
        'syllabus.w9.desc': 'Kintamieji, ciklai ir funkcijos. OpenAI API naudojimas paprasto pokalbių roboto kūrimui.',
        'syllabus.w10.title': '10 Savaitė: Web Pagrindai (HTML/CSS)',
        'syllabus.w10.desc': 'Asmeninės portfolio svetainės kūrimas darbų pristatymui.',
        'syllabus.w11.title': '11 Savaitė: AI Integravimas į Kodą',
        'syllabus.w11.desc': 'Paprasto žaidimo kūrimas (pvz., „Pasirink savo nuotykį“), paremto AI logika.',
        'syllabus.w12.title': '12 Savaitė: Finalinė Demo Diena',
        'syllabus.w12.desc': '<strong>Rezultatas:</strong> Pristatyti savo galutinę portfolio svetainę ir gyvą projektą tėvams ir bendraamžiams.',

        // FAQ Page
        'faq.title': 'Dažniausiai Užduodami <span class="gradient-text">Klausimai</span>',
        'faq.subtitle': 'Viskas, ką reikia žinoti apie mūsų programas, grupes ir saugumo politikas.',
        'faq.q1': 'Kokio amžiaus vaikams skirta ši programa?',
        'faq.a1': 'Web Genius yra specialiai sukurta 10-16 metų vaikams. Mūsų programa pritaikyta būti įtraukianti ir saugi šiai amžiaus grupei, derinant smagią kūrybą su techniniais įgūdžiais.',
        'faq.q2': 'Ar reikia galingo kompiuterio?',
        'faq.a2': 'Nebūtinai! Dauguma mūsų įrankių veikia debesyje (naršyklėje). Standartinis nešiojamas kompiuteris (Windows, Mac ar Chromebook), išleistas per pastaruosius 4-5 metus, yra pakankamas. Planšetės tinka pamokų peržiūrai, bet programavimo ir montavimo dalims reikalinga klaviatūra ir pelė.',
        'faq.q3': 'Ar AI turinis saugus vaikams?',
        'faq.a3': 'Visiškai. Saugumas yra mūsų prioritetas nr. 1. Mes naudojame filtruotas AI įrankių versijas ir mokome studentus apie skaitmeninį saugumą, duomenų privatumą ir etišką AI naudojimą. Visas gyvas sąveikas prižiūri apmokyti pedagogai.',
        'faq.q4': 'Kas nutinka, jei praleidžiame gyvą sesiją?',
        'faq.a4': 'Visos gyvos mentorystės sesijos įrašomos ir pateikiamos Studentų Portale per 24 valandas. Jūsų vaikas gali peržiūrėti įrašą ir pateikti klausimus mentoriui per platformą.',
        'faq.q5': 'Kokia jūsų pinigų grąžinimo politika?',
        'faq.a5': 'Siūlome „Pasitenkinimo garantiją“. Jei per pirmas 14 dienų nuo grupės starto nesate patenkinti programa, praneškite mums ir mes grąžinsime visus pinigus be jokių klausimų.',
        'faq.q6': 'Ar mano vaikas gaus sertifikatą?',
        'faq.a6': 'Taip! Sėkmingai baigus 3 mėnesių Gyvąją Akademiją ir pateikus galutinį portfolio projektą, studentai gauna patvirtintą skaitmeninį diplomą iš Web Genius.',

        // Legal Pages (General)
        'legal.privacy_title': 'Privatumo Politika',
        'legal.last_updated': 'Paskutinį kartą atnaujinta: 2026 m. vasario mėn.',
        'legal.terms_title': 'Paslaugų Sąlygos',
        'legal.cookies_title': 'Slapukų Politika',

        // Privacy Content (Simplified for brevity, usually legal texts are kept in original lang or fully translated contexts, assuming simplified here)
        'privacy.intro_title': '1. Įvadas',
        'privacy.intro_text': 'Web Genius („mes“, „mūsų“ arba „mus“) yra įsipareigojusi saugoti savo studentų (vaikų) ir jų tėvų privatumą. Ši Privatumo politika paaiškina, kaip renkame, naudojame ir saugome jūsų informaciją.',
        'privacy.collect_title': '2. Informacija, kurią renkame',
        'privacy.collect_text': 'Mes renkame tik būtiniausią informaciją, reikalingą mūsų švietimo paslaugoms teikti:',
        'privacy.collect_list1': '<strong>Tėvų informacija:</strong> Vardas, el. pašto adresas ir mokėjimo informacija (apdorojama per saugius trečiųjų šalių tiekėjus).',
        'privacy.collect_list2': '<strong>Mokinio informacija:</strong> Vardas, amžius ir platformoje sukurti projektai. Mes nerenkame tikslių geolokacijos ar biometrinės informacijos duomenų.',
        'privacy.child_title': '3. Vaikų privatumas (COPPA ir BDAR)',
        'privacy.child_text': 'Mes griežtai laikomės Vaikų apsaugos internete akto (COPPA) ir BDAR reikalavimų vaikams:',
        'privacy.child_list1': 'Reikalaujame patvirtinto tėvų sutikimo prieš rinkdami bet kokią asmeninę informaciją iš vaiko iki 13 metų.',
        'privacy.child_list2': 'Mes neparduodame studentų duomenų trečiosioms šalims.',
        'privacy.child_list3': 'Mes nerodome tikslinės reklamos studentams.',
        'privacy.use_title': '4. Kaip mes naudojame informaciją',
        'privacy.use_text': 'Mes naudojame jūsų duomenis siekdami:',
        'privacy.use_list1': 'Užtikrinti sklandų internetinį kursą.',
        'privacy.use_list2': 'Stebėti studentų pažangą ir išduoti diplomus.',
        'privacy.use_list3': 'Bendrauti su tėvais dėl grupių tvarkaraščių ir paskyros atnaujinimų.',
        'privacy.sec_title': '5. Duomenų saugumas',
        'privacy.sec_text': 'Mes taikome pramonės standartus atitinkančias šifravimo ir saugumo priemones, kad apsaugotumėme jūsų duomenis mūsų serveriuose (per Supabase). Tačiau joks duomenų perdavimo būdas internetu nėra 100% saugus.',
        'privacy.contact_title': '6. Susisiekite su mumis',
        'privacy.contact_text': 'Jei turite klausimų apie šią politiką, susisiekite su mumis el. paštu <a href="mailto:privacy@webgenius.com" style="color:var(--blue)">privacy@webgenius.com</a>.',

        // Terms Content
        'terms.accept_title': '1. Sąlygų priėmimas',
        'terms.accept_text': 'Prisijungdami ar naudodamiesi Web Genius platforma, sutinkate su šiomis Paslaugų sąlygomis. Jei esate tėvas ar globėjas, sutinkate su šiomis sąlygomis savo vaiko vardu.',
        'terms.edu_title': '2. Švietimo paslaugos',
        'terms.edu_text': 'Web Genius teikia internetinius kursus, mentorystę ir švietimo turinį. Mes pasiliekame teisę bet kada keisti programą, tvarkaraštį ar platformos funkcijas, siekdami pagerinti edukacinę patirtį.',
        'terms.code_title': '3. Elgesio kodeksas',
        'terms.code_text': 'Mes puoselėjame saugią ir pozityvią mokymosi aplinką. Studentai privalo:',
        'terms.code_list1': 'Gerbti mentorius ir bendraamžius.',
        'terms.code_list2': 'Nesidalinti netinkamu turiniu ar kalba.',
        'terms.code_list3': 'Nesidalinti asmenine kontaktine informacija su kitais studentais.',
        'terms.code_violation': 'Šių taisyklių pažeidimas gali lemti pašalinimą iš programos be pinigų grąžinimo.',
        'terms.pay_title': '4. Mokėjimai ir grąžinimai',
        'terms.pay_text': 'Mokestis už mokslą mokamas registracijos metu. Siūlome 14 dienų pasitenkinimo garantiją su pilnu pinigų grąžinimu. Po 14 dienų grąžinimai paprastai nevykdomi, išskyrus ypatingas aplinkybes.',
        'terms.ip_title': '5. Intelektinė nuosavybė',
        'terms.ip_text': 'Studentai išlaiko nuosavybės teises į savo sukurtus projektus (žaidimus, istorijas, kodą). Web Genius išlaiko nuosavybės teises į kursų medžiagą, vaizdo įrašus ir platformos kodą.',
        'terms.liab_title': '6. Atsakomybės apribojimas',
        'terms.liab_text': 'Web Genius yra edukacinis įrankis. Mes neatsakome už tai, kaip studentai panaudoja įgūdžius, įgytus už mūsų platformos ribų.',

        // Cookies Content
        'cookies.what_title': '1. Kas yra slapukai?',
        'cookies.what_text': 'Slapukai yra maži tekstiniai failai, saugomi jūsų įrenginyje, kai lankotės svetainėje. Jie padeda svetainei tinkamai veikti ir prisiminti jūsų nustatymus.',
        'cookies.use_title': '2. Kaip mes naudojame slapukus',
        'cookies.use_text': 'Web Genius naudoja slapukus šiais tikslais:',
        'cookies.use_list1': '<strong>Būtinieji slapukai:</strong> Reikalingi svetainės veikimui (pvz., prisijungimui prie Mokinio/Tėvų portalo, mokėjimų apdorojimui).',
        'cookies.use_list2': '<strong>Nuostatų slapukai:</strong> Prisimena jūsų kalbos nustatymus (EN/LT).',
        'cookies.use_list3': '<strong>Analitikos slapukai:</strong> Naudojame minimalią analitiką, kad matytume, kurie puslapiai populiariausi. Mes NESEKAME individualių studentų naršymo įpročių reklamai.',
        'cookies.manage_title': '3. Slapukų valdymas',
        'cookies.manage_text': 'Galite valdyti slapukų nustatymus savo naršyklėje. Tačiau būtinųjų slapukų išjungimas gali neleisti prisijungti prie jūsų paskyros.',
        'cookies.update_title': '4. Atnaujinimai',
        'cookies.update_text': 'Mes galime retkarčiais atnaujinti šią politiką. Prašome reguliariai tikrinti pakeitimus.',
    },
};

/* ----------------------------------------------------------
   i18n Engine
   ---------------------------------------------------------- */
let currentLang = 'en';

function setLanguage(lang) {
    currentLang = lang;
    const strings = i18n[lang];
    if (!strings) return;

    document.documentElement.lang = lang === 'lt' ? 'lt' : 'en';

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.dataset.i18n;
        if (strings[key]) {
            el.innerHTML = strings[key];
        }
    });

    // Update page title
    document.title = lang === 'lt'
        ? 'Web Genius — AI ir programavimo akademija vaikams'
        : 'Web Genius — AI & Coding Academy for Kids';

    // Persist preference
    localStorage.setItem('wg_lang', lang);
}

/* ----------------------------------------------------------
   DOM Ready
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

    /* --------------------------------------------------------
       1. Scroll-reveal (Intersection Observer)
       -------------------------------------------------------- */
    const reveals = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );
    reveals.forEach((el) => revealObserver.observe(el));

    /* --------------------------------------------------------
       2. Navbar scroll effect
       -------------------------------------------------------- */
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    });

    /* --------------------------------------------------------
       3. Mobile hamburger menu
       -------------------------------------------------------- */
    // Mobile Menu
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            hamburger.classList.toggle('active');
        });

        // Close mobile menu when a link is clicked
        document.querySelectorAll('.nav-links a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                hamburger.classList.remove('active');
            });
        });
    }

    /* --------------------------------------------------------
       4. Region / Language switcher (in navbar)
       -------------------------------------------------------- */
    const regionBtns = document.querySelectorAll('.region-switcher button');
    regionBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            regionBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            setLanguage(btn.dataset.region);
        });
    });

    // Restore saved language preference or auto-detect
    let savedLang = localStorage.getItem('wg_lang');

    // If no preference saved, detect browser language
    if (!savedLang) {
        const userLang = navigator.language || navigator.userLanguage;
        if (userLang && userLang.startsWith('lt')) {
            savedLang = 'lt';
        }
    }

    if (savedLang && savedLang !== 'en') {
        const targetBtn = document.querySelector(`.region-switcher button[data-region="${savedLang}"]`);
        if (targetBtn) {
            regionBtns.forEach((b) => b.classList.remove('active'));
            targetBtn.classList.add('active');
            setLanguage(savedLang);
        }
    }

    /* --------------------------------------------------------
       5. Smooth-scroll for anchor links
       -------------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* --------------------------------------------------------
       6. Stagger animation for cards
       -------------------------------------------------------- */
    const staggerItems = document.querySelectorAll('.path-card, .review-card, .timeline-item');
    staggerItems.forEach((item, i) => {
        item.style.transitionDelay = `${i * 0.1}s`;
    });

    /* --------------------------------------------------------
       7. Registration Modal Logic
       -------------------------------------------------------- */
    const modal = document.getElementById('regModal');
    const openBtns = document.querySelectorAll('a[href="#"], .btn-primary, .nav-cta, .btn-secondary'); // Broad selector, filter inside
    const closeBtn = document.getElementById('closeModal');
    const regForm = document.getElementById('regForm');
    const cohortSelect = document.getElementById('cohort');

    // Filter which buttons open the modal (specifically "Apply" or "Join" related, excluding nav anchors)
    // Actually, let's target specific buttons for clarity if possible, or check text content
    // For now, attaching to all "Join Live Academy" or "Apply Now" buttons
    // The HTML has `data-i18n` attributes we can use, or just class references if specific.
    // The hero buttons are: .btn-primary, .btn-secondary. The values are "Join the Live Academy" etc.

    // Helper to open modal
    async function openModal(type = 'fixed') {
        if (!modal) return;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // prevent background scrolling

        // Update Modal Title based on type
        const titleEl = modal.querySelector('h3[data-i18n="modal.title"]');
        const subEl = modal.querySelector('p[data-i18n="modal.subtitle"]');

        if (type === 'recurring') {
            if (titleEl) titleEl.innerText = currentLang === 'lt' ? 'Registracija į Kūrėjų Klubą' : 'Join the Creators Club';
            if (subEl) subEl.innerText = currentLang === 'lt' ? 'Savaitiniai užsiėmimai absolventams.' : 'Weekly sessions for academy graduates.';
        } else {
            if (titleEl) titleEl.innerText = i18n[currentLang]['modal.title'];
            if (subEl) subEl.innerText = i18n[currentLang]['modal.subtitle'];
        }

        // Always reload options to filter correctly
        cohortSelect.innerHTML = '<option disabled selected>Loading...</option>';

        // Fetch upcoming cohorts
        if (true) {
            try {
                // Use the global getCohorts from supabase.js if available, or direct query
                const { data: cohorts, error } = await window.supabase
                    .from('cohorts')
                    .select('*')
                    .or('status.eq.upcoming,status.eq.active')
                    .order('starts_at', { ascending: true });

                if (error) throw error;

                // Filter for matching language AND type
                const upcoming = cohorts.filter(c => {
                    const cohortLocale = c.language || 'en';
                    const langOk = cohortLocale === currentLang;

                    let typeOk = true;
                    if (type === 'recurring') {
                        typeOk = c.is_recurring === true;
                    } else {
                        typeOk = !c.is_recurring; // 'fixed' only shows non-recurring
                    }

                    return (c.status === 'upcoming' || c.status === 'active') && langOk && typeOk;
                });

                cohortSelect.innerHTML = ''; // clear placeholder

                // Add default placeholder
                const placeholder = document.createElement('option');
                placeholder.text = i18n[currentLang]['modal.select_placeholder'] || 'Select Cohort';
                placeholder.disabled = true;
                placeholder.selected = true;
                cohortSelect.appendChild(placeholder);

                if (upcoming.length === 0) {
                    const opt = document.createElement('option');
                    opt.text = currentLang === 'lt' ? 'Nėra aktyvių grupių jūsų kalba' : 'No active cohorts in your language';
                    opt.disabled = true;
                    cohortSelect.appendChild(opt);
                } else {
                    upcoming.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c.id;

                        let label = c.name;
                        if (c.is_recurring && c.schedule_pattern) {
                            const days = c.schedule_pattern.days ? c.schedule_pattern.days.join(', ') : '';
                            const time = c.schedule_pattern.time || '';
                            const dayTrans = currentLang === 'lt' ? translateDays(days) : days;
                            label += ` (${dayTrans} ${time})`;
                        } else {
                            const date = new Date(c.starts_at).toLocaleDateString(currentLang === 'lt' ? 'lt-LT' : 'en-US');
                            label += ` (${date})`;
                        }

                        opt.text = label;
                        cohortSelect.appendChild(opt);
                    });
                }
            } catch (err) {
                console.error('Error loading cohorts:', err);
                cohortSelect.innerHTML = `<option disabled>${currentLang === 'lt' ? 'Klaida kraunant grupes' : 'Error loading cohorts'}</option>`;
            }
        }
    }

    function translateDays(dayStr) {
        const map = {
            'Monday': 'Pirmadienis',
            'Tuesday': 'Antradienis',
            'Wednesday': 'Trečiadienis',
            'Thursday': 'Ketvirtadienis',
            'Friday': 'Penktadienis',
            'Saturday': 'Šeštadienis',
            'Sunday': 'Sekmadienis'
        };
        // Simple replace for single days, might need split/join for multiple
        return map[dayStr] || dayStr;
    }

    // Attach to specific elements
    // Attach to Live Academy Buttons (Generic)
    document.querySelectorAll('.nav-cta, .hero-buttons .btn-primary, .path-card.recommended .btn-primary, .cta-banner .btn-white').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('fixed');
        });
    });

    // Attach to Creators Club Button (Specific)
    const recurringBtn = document.getElementById('btn-recurring');
    if (recurringBtn) {
        recurringBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('recurring');
        });
    }

    // Also "Get Started" on Explorer card? The prompt says "Ateities kūrėjas" (Future Creator). 
    // Explorer is self-paced. Logic might differ. 
    // User request: "I want to add email forms for registering to the Ateities kūrėjas courses... when they want to register to the academy."
    // So specifically for Future Creator (Live Academy).
    // The selector above covers `.path-card.recommended .btn-primary` which is Future Creator.
    // `.hero-buttons .btn-primary` is "Join the Live Academy".
    // `.nav-cta` is "Join Live Academy".
    // `.cta-banner .btn-white` is "Apply to the Live Academy".
    // Matches perfectly.

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close on outside click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Handle Form Submission
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('regSubmit');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '...';

            const email = document.getElementById('email').value;
            const cohortId = document.getElementById('cohort').value;

            try {
                const { error } = await window.supabase
                    .from('course_registrations')
                    .insert({ email, cohort_id: cohortId });

                if (error) throw error;

                // Success
                btn.innerHTML = i18n[currentLang]['modal.success'];
                btn.classList.add('btn-success'); // semantic class if we had it, otherwise just text
                setTimeout(() => {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                    regForm.reset();
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }, 2000);

            } catch (err) {
                console.error('Registration error:', err);
                btn.innerHTML = i18n[currentLang]['modal.error'];
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }, 3000);
            }
        });
    }

});
