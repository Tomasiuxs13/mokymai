(async () => {
    const log = (msg) => {
        const el = document.getElementById('logs');
        const p = document.createElement('p');
        p.textContent = msg;
        el.appendChild(p);
        console.log(msg);
    };

    log('🚀 Starting setup...');

    const sb = window.WebGeniusDB.supabase;
    if (!sb) {
        log('❌ Supabase client not found');
        return;
    }

    try {
        // 1. Create Admin User (if not exists) or Sign In
        const adminEmail = 'tomasnokuss@gmail.com';
        const adminPass = 'Tomukas69?!';

        log(`🔑 Attempting to sign in as ${adminEmail}...`);
        let { data: authData, error: authError } = await sb.auth.signInWithPassword({
            email: adminEmail,
            password: adminPass
        });

        if (authError) {
            log(`⚠️ Login failed, attempting to create admin...`);
            const { data: signUpData, error: signUpError } = await window.signUp(adminEmail, adminPass, {
                full_name: 'System Admin',
                role: 'admin'
            });
            if (signUpError) throw signUpError;
            authData = signUpData;
            log('✅ Admin user created.');
        } else {
            log('✅ Admin signed in.');
        }

        // 2. Create Cohort
        log('📅 Creating Cohort...');
        const { data: cohort, error: cohortError } = await sb
            .from('cohorts')
            .upsert({
                name: 'Web Dev Bootcamp 2026',
                starts_at: new Date().toISOString(),
                ends_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active',
                max_seats: 50,
                price_usd: 997
            })
            .select()
            .single(); // upsert might fail if name is not unique constraint? Assuming simple insert for now or unique constraint.
        // Actually let's check if it exists or append timestamp to name to be safe

        if (cohortError) {
            // If checking existence is hard, just insert new one
            const { data: newCohort, error: newCohortError } = await sb
                .from('cohorts')
                .insert({
                    name: `Web Dev Bootcamp ${Date.now()}`,
                    starts_at: new Date().toISOString(),
                    ends_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'active',
                    max_seats: 50,
                    price_usd: 997
                })
                .select()
                .single();
            if (newCohortError) throw newCohortError;
            log(`✅ Cohort created: ${newCohort.name}`);
            var targetCohort = newCohort;
        } else {
            log(`✅ Cohort created/found: ${cohort.name}`);
            var targetCohort = cohort;
        }

        // 3. Create Course
        log('📚 Creating Course...');
        const { data: course, error: courseError } = await sb
            .from('courses')
            .insert({
                cohort_id: targetCohort.id,
                title: 'Full Stack Mastery',
                description: 'Master HTML, CSS, JS, and Node.js in this comprehensive course.',
                type: 'course',
                sort_order: 1,
                published: true
            })
            .select()
            .single();
        if (courseError) throw courseError;
        log(`✅ Course created: ${course.title}`);

        // 4. Create Lessons
        log('📝 Creating Lessons...');
        const lessonsData = [
            { title: 'Introduction to Web Dev', description: 'Understanding how the web works.', duration_min: 15 },
            { title: 'HTML Basics', description: 'Tags, attributes, and structure.', duration_min: 45 },
            { title: 'CSS Styling', description: 'Colors, fonts, and box model.', duration_min: 60 },
            { title: 'JavaScript Fundamentals', description: 'Variables, loops, and functions.', duration_min: 90 }
        ];

        for (let i = 0; i < lessonsData.length; i++) {
            await sb.from('lessons').insert({
                course_id: course.id,
                title: lessonsData[i].title,
                description: lessonsData[i].description,
                duration_min: lessonsData[i].duration_min,
                sort_order: i + 1,
                is_free: i === 0
            });
        }
        log(`✅ ${lessonsData.length} Lessons created.`);

        // 5. Enroll Student
        const studentEmail = 'tomasiuxs13@gmail.com';
        log(`🎓 Enrolling student ${studentEmail}...`);

        let targetStudentId = null;

        const { data: studentProfile, error: profileError } = await sb
            .from('profiles')
            .select('*')
            .eq('full_name', 'Tomas Studentas')
            .single();

        if (profileError || !studentProfile) {
            log('⚠️ Could not find student profile by name. Signing in as student to self-enroll...');
            await sb.auth.signOut();
            const { data: studentAuth, error: studentAuthError } = await sb.auth.signInWithPassword({
                email: studentEmail,
                password: 'Tomukas69?!'
            });
            if (studentAuthError) throw studentAuthError;

            targetStudentId = studentAuth.user.id;
            log(`✅ Signed in as student: ${targetStudentId}`);

            const { error: enrollError } = await sb
                .from('enrollments')
                .insert({
                    student_id: targetStudentId,
                    cohort_id: targetCohort.id,
                    status: 'active',
                    enrolled_at: new Date().toISOString()
                });
            if (enrollError) console.warn('Enrollment might already exist or failed:', enrollError);
            else log('✅ Enrollment successful.');

        } else {
            targetStudentId = studentProfile.id;
            // Admin enrolling student
            const { error: enrollError } = await sb
                .from('enrollments')
                .insert({
                    student_id: targetStudentId,
                    cohort_id: targetCohort.id,
                    status: 'active',
                    enrolled_at: new Date().toISOString()
                });
            if (enrollError) console.warn('Enrollment might already exist or failed:', enrollError);
            else log('✅ Enrollment successful.');
        }

        // 6. Create Assignment (Admin)
        log('📝 Creating Assignment for first lesson...');
        const { data: firstLesson } = await sb
            .from('lessons')
            .select('id')
            .eq('course_id', course.id)
            .order('sort_order', { ascending: true })
            .limit(1)
            .single();

        if (firstLesson) {
            const { data: assign, error: assignError } = await sb
                .from('assignments')
                .upsert({
                    lesson_id: firstLesson.id,
                    title: 'Build Your First Page',
                    description: 'Create a simple HTML page with a heading and a paragraph. Submit a screenshot or link.',
                    max_points: 100,
                    due_offset_days: 7
                }, { onConflict: 'lesson_id' }) // Start with upsert on lesson_id not ideal if multiple assigns allowed, but ok for demo
                .select()
                .single();
            // Assignments doesn't have unique constraint on lesson_id usually, but let's just insert if not exists

            if (assignError) {
                // Fallback to check exist
                const { data: exists } = await sb.from('assignments').select('id').eq('lesson_id', firstLesson.id).limit(1);
                if (!exists || exists.length === 0) {
                    await sb.from('assignments').insert({
                        lesson_id: firstLesson.id,
                        title: 'Build Your First Page',
                        description: 'Create a simple HTML page with a heading and a paragraph. Submit a screenshot or link.',
                        max_points: 100,
                        due_offset_days: 7
                    });
                    log('✅ Assignment created.');
                } else {
                    log('✅ Assignment already exists.');
                }
            } else {
                log('✅ Assignment created/updated.');
            }
        }

        // 7. Issue Diploma (Achievement)
        log('🏆 Issuing Diploma...');
        // Check if diploma exists
        const { data: diplomas } = await sb
            .from('diplomas')
            .select('id')
            .eq('student_id', targetStudentId)
            .eq('cohort_id', targetCohort.id);

        if (!diplomas || diplomas.length === 0) {
            const { error: dipError } = await sb.from('diplomas').insert({
                student_id: targetStudentId,
                cohort_id: targetCohort.id,
                final_grade: 95.5,
                certificate_url: 'https://example.com/certificate.pdf'
            });
            if (dipError) log(`❌ Diploma issue failed: ${dipError.message}`);
            else log('✅ Diploma issued.');
        } else {
            log('✅ Diploma already issued.');
        }

        log('🎉 SETUP COMPLETE! You can close this page.');

    } catch (err) {
        log(`❌ Error: ${err.message}`);
        console.error(err);
    }
})();
