import type { Metadata } from "next";
import "./guide.css";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Locker for Teachers — Orientation Guide",
  description: "A teacher's orientation guide to Locker — getting started, classes, the student notebook, PTMs, and everything else.",
  path: "/guide",
});

/**
 * Static orientation guide, intentionally OUTSIDE the (app) auth-gated
 * route group — a teacher should be able to open and share this link
 * before they've even signed up. Content lives as a plain HTML string
 * (not JSX) so it stays a straight copy-paste edit for whoever owns the
 * copy — see guide.css for the matching styles.
 */
export default function GuidePage() {
  return <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />;
}

const BODY_HTML = `<div class="topbar">
  <div class="mark"><span class="dot"></span></div>
  <div class="brandline"><b>Locker</b><span>for teachers</span></div>
</div>

<div class="shell">
  <div class="maincol">

    <div class="hero">
      <span class="eyebrow">🏫 Teacher orientation</span>
      <h1>Everything Locker actually does, in the order you'll use it.</h1>
      <p class="lede">
        Locker is the collaboration layer for your school — not a replacement for the ERP you already use
        for attendance, official notices, and administrative records. This is what it handles instead.
      </p>
      <div class="not-erp">
        <div class="pill"><b>Your ERP keeps</b> attendance · fees · official notices · records</div>
        <div class="pill"><b>Locker handles</b> classes · PTMs · homework · student notes · messaging</div>
      </div>
    </div>

    <section id="start">
      <p class="kicker">Getting started</p>
      <h2>Four steps, and you're teaching on Locker</h2>
      <p class="dek">Each of these happens once. After that, everything below is what you'll actually use day to day.</p>

      <div class="steps">
        <div class="step">
          <div class="n">1</div>
          <div>
            <h4>Create your account and pick "Teacher"</h4>
            <p>Sign up with your email. When asked whether you're a Student, Teacher, or Principal/IT Admin, choose Teacher — this can't be changed later, so it's worth getting right the first time.</p>
          </div>
        </div>
        <div class="step">
          <div class="n">2</div>
          <div>
            <h4>Find your school and join with your staff code</h4>
            <p>Search for your school by name. If it's already on Locker, you'll be asked for a <span class="chip">staff code</span> — get this from your Principal/IT Admin. It's what proves you're actually staff there, before you can create or join a single class.</p>
          </div>
        </div>
        <div class="step">
          <div class="n">3</div>
          <div>
            <h4>Create a class, or join one that already exists</h4>
            <p>If your class doesn't exist yet, create it (grade + section) and say which subject <em>you</em> teach there. If a colleague already set it up, join it instead and label your own subject — see "Your classes" below.</p>
          </div>
        </div>
        <div class="step">
          <div class="n">4</div>
          <div>
            <h4>Share your invite code with students</h4>
            <p>Every class gets a 6-character invite code. Students enter it once to join — no approval step needed on your end.</p>
          </div>
        </div>
      </div>

      <div class="tip">
        <span class="icon">🔑</span>
        <p><strong>Two codes, two purposes.</strong> Your <em>staff code</em> (from the Principal/IT Admin) gets you into the school. Each class's own <em>invite code</em> (yours to generate) gets students into that specific class. Don't mix them up.</p>
      </div>
    </section>

    <section id="classes">
      <p class="kicker">Your classes</p>
      <h2>A class is a group of students. Subjects belong to you, not the class.</h2>
      <p class="dek">
        "Grade 10 – Section A" is one group of students taught by several different teachers across the day.
        Locker models it that way: subject is something <em>you</em> attach when you join a class, not a fixed label on the class itself.
      </p>

      <div class="cards">
        <div class="card">
          <span class="tag">Create</span>
          <h4>Start a new class</h4>
          <p>Pick a grade and section, name the subject you teach there, and you're its teacher — with a governing role over renaming, archiving, and membership.</p>
        </div>
        <div class="card">
          <span class="tag">Join</span>
          <h4>Teach an existing class</h4>
          <p>Under <strong>Classes → Join a class at [your school]</strong>, you'll see every class in your own school. Join any of them and label your subject — no invite code required, since your staff code already vouches for you.</p>
        </div>
        <div class="card">
          <span class="tag">Bundle</span>
          <h4>Compound classes</h4>
          <p>Teach Math to all four sections of Grade 10? Group them into one compound class under <strong>Classes → Create a compound class</strong> so you think of (and eventually manage) them as one unit.</p>
        </div>
      </div>

      <div class="tip">
        <span class="icon">🚫</span>
        <p><strong>What you can't do:</strong> join a class at a school you haven't been given a staff code for, or hand your class off to a student. Ownership of a school class is fixed to whoever teaches it — never a popularity contest.</p>
      </div>
    </section>

    <section id="notebook">
      <p class="kicker">Class roster &amp; student notebook</p>
      <h2>Everything about one student, in one place — before report cards force you to remember it</h2>
      <p class="dek">Open any class's roster, click a student, and you get three things at once:</p>

      <dl class="deflist">
        <div class="defrow">
          <dt>Homework follow-up</dt>
          <dd>Which assignments this student hasn't marked done, pulled straight from the homework board — nothing new to log.</dd>
        </div>
        <div class="defrow">
          <dt>Quick notes</dt>
          <dd>A few seconds to log an observation — behavior, participation, a homework flag, a small win — tagged and timestamped, so it's there when you actually need it.</dd>
        </div>
        <div class="defrow">
          <dt>Achievement review</dt>
          <dd>Students log their own competitions and certifications. You can Verify or Reject the ones from your own students, right from the same page.</dd>
        </div>
      </dl>

      <p style="margin-top:18px">This is deliberately not a gradebook or an attendance register — your ERP still owns those. It's the informal, ongoing texture that report-card remarks and parent conversations actually draw on.</p>
    </section>

    <section id="ptm">
      <p class="kicker">Parent-teacher meetings</p>
      <h2>Open slots once. Let people book what's free.</h2>
      <p class="dek">No more trading calls to find a time that works.</p>

      <div class="cards">
        <div class="card">
          <span class="tag">You do</span>
          <h4>Open a time window</h4>
          <p>Pick a date, a start and end time, and a slot length (say, 10 minutes) — Locker slices it into individual bookable slots automatically.</p>
        </div>
        <div class="card">
          <span class="tag">They do</span>
          <h4>Book what's open</h4>
          <p>Students (or whoever's attending on the family's behalf) claim a slot. Once it's taken, nobody else can double-book it — enforced at the database level, not just in the interface.</p>
        </div>
        <div class="card">
          <span class="tag">You can</span>
          <h4>Cancel an unclaimed slot</h4>
          <p>Changed your availability? Cancel any slot that hasn't been booked yet, right from the same screen.</p>
        </div>
      </div>
    </section>

    <section id="everyday">
      <p class="kicker">The rest, day to day</p>
      <h2>What else is actually in here</h2>

      <div class="cards">
        <div class="card">
          <span class="tag">Homework</span>
          <h4>The shared assignment board</h4>
          <p>Post what's due; students check it off. If someone missed class, it's already on the board — no separate announcement needed.</p>
        </div>
        <div class="card">
          <span class="tag">Messages</span>
          <h4>Direct messages</h4>
          <p>Reach any student or colleague in your school directly, without hunting down a phone number.</p>
        </div>
        <div class="card">
          <span class="tag">My Tasks</span>
          <h4>Your own to-do list</h4>
          <p>The informal asks that live nowhere official — a coordinator's request, a reminder to yourself — kept private to your account.</p>
        </div>
        <div class="card">
          <span class="tag">Group Finder</span>
          <h4>Student project workspaces</h4>
          <p>Students self-organize into project groups with their own tasks and resources — you don't need to manage this, just know it exists.</p>
        </div>
      </div>

      <div class="tip">
        <span class="icon">🎓</span>
        <p><strong>Rewards, Achievements, and the Marketplace</strong> are student-facing features (points, badges, a school-only buy/sell board, and a portfolio of real accomplishments). You won't see Rewards on your own account — gamification is a student-motivation layer, not something staff accounts use.</p>
      </div>
    </section>

    <section id="reference">
      <p class="kicker">Quick reference</p>
      <h2>Who can do what</h2>

      <div class="tablewrap">
        <table>
          <thead><tr><th>Role</th><th>Creates</th><th>Joins</th></tr></thead>
          <tbody>
            <tr><td>Principal/IT Admin</td><td>The school itself</td><td>Any class in their own school, automatically</td></tr>
            <tr><td>Teacher</td><td>A class, once staff of that school</td><td>Any other class in that same school</td></tr>
            <tr><td>Student</td><td>Nothing — no class or school creation</td><td>A class, with its invite code</td></tr>
          </tbody>
        </table>
      </div>

      <h3>Codes at a glance</h3>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Code</th><th>Who has it</th><th>What it unlocks</th></tr></thead>
          <tbody>
            <tr><td>Staff code</td><td>Your Principal/IT Admin</td><td>Joining the school itself, as staff</td></tr>
            <tr><td>Class invite code</td><td>You, per class you teach</td><td>Students joining that one class</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section id="faq">
      <p class="kicker">Questions</p>
      <h2>Good to know</h2>

      <details>
        <summary>I teach the same subject to five different sections. Do I create five classes?</summary>
        <p>You join or create each section individually (they're different groups of students), then bundle the ones you teach that subject to into one compound class so you can think of them as a unit.</p>
      </details>
      <details>
        <summary>Can I see a student's notes if I'm not their teacher?</summary>
        <p>No. The Student Notebook only opens for students genuinely in a class you teach — checked on the server every time, not just hidden in the interface.</p>
      </details>
      <details>
        <summary>What happens if I lose my staff code?</summary>
        <p>Ask your Principal/IT Admin — they can generate a new one from School Settings at any time. The old one stops working the moment they do.</p>
      </details>
      <details>
        <summary>Does Locker replace our attendance system or ERP?</summary>
        <p>No, and it's not trying to. Locker is the collaboration layer on top — classes, PTMs, homework, messaging — while your existing ERP stays the system of record for attendance and official administration.</p>
      </details>
      <details>
        <summary>Can a student remove themselves from my class?</summary>
        <p>Yes, anytime, with no approval needed. You can't be removed as the class's teacher the same way — that requires a Principal/IT Admin-level action.</p>
      </details>
    </section>

  </div>

  <nav class="rail">
    <div class="railtitle">On this page</div>
    <a href="#start">Getting started</a>
    <a href="#classes">Your classes</a>
    <a href="#notebook">Roster &amp; notebook</a>
    <a href="#ptm">Parent-teacher meetings</a>
    <a href="#everyday">Day to day</a>
    <a href="#reference">Quick reference</a>
    <a href="#faq">Questions</a>
  </nav>
</div>

<footer>Locker — the collaboration layer for students, teachers, and principals.</footer>`;
