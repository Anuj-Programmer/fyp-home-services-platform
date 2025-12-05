import React from "react";
import Navbar from "../../blocks/Navbar"; 
import Footer from "../../blocks/Footer";
import "../../css/landingPage.css";

const stats = [
  { label: "Pending Requests", value: 12 },
  { label: "Active Technicians", value: 34 },
  { label: "Resolved Tickets", value: 128 },
  { label: "Revenue (This Week)", value: "$4,560" },
];

const recentActivities = [
  {
    id: 1,
    title: "New technician application",
    body: "Bikash Poudel submitted verification documents.",
    time: "5 min ago",
  },
  {
    id: 2,
    title: "Service escalation resolved",
    body: "Cleaner assigned to case #2451 completed follow-up.",
    time: "32 min ago",
  },
  {
    id: 3,
    title: "Upcoming maintenance",
    body: "System downtime scheduled for Saturday 2:00 AM.",
    time: "2 hrs ago",
  },
];

function AdminPanel() {
  return (
    <>
      <Navbar />
      <main className="w-full px-6 lg:px-32 pt-24 pb-16 space-y-10 min-h-screen bg-stone-50">
        <section className="flex flex-col lg:flex-row justify-between gap-6">
          <div className="flex-1 space-y-4">
            <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
              Admin overview
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
              Central command for every service and technician
            </h1>
            <p className="text-base text-stone-500 max-w-2xl">
              Review system health, approve new professionals, and keep an eye on
              critical service requests. Everything you need to keep operations
              running smoothly lives here.
            </p>
          </div>

          <div className="w-full lg:w-80 p-5 rounded-2xl bg-white shadow-sm border">
            <p className="text-xs font-semibold text-stone-500 mb-3">
              Quick actions
            </p>
            <div className="flex flex-col gap-3">
              <button className="px-4 py-3 rounded-xl border text-left text-sm font-semibold hover:bg-stone-50 btn-transparent-slide">
                Review pending verifications
              </button>
              <button className="px-4 py-3 rounded-xl border text-left text-sm font-semibold hover:bg-stone-50 btn-transparent-slide">
                Publish announcement
              </button>
              <button className="px-4 py-3 rounded-xl border text-left text-sm font-semibold hover:bg-stone-50 btn-transparent-slide">
                Generate weekly report
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="p-5 rounded-2xl bg-white shadow-sm border flex flex-col gap-1"
            >
              <span className="text-sm text-stone-500">{item.label}</span>
              <strong className="text-2xl font-semibold txt-color-primary">
                {item.value}
              </strong>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white shadow-sm border space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold txt-color-primary">
                  Latest activity
                </h2>
                <p className="text-sm text-stone-500">
                  Stay updated with the most recent operations
                </p>
              </div>
              <button className="text-sm text-color-main hover:underline">
                View all
              </button>
            </div>

            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 rounded-xl border bg-stone-50 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold txt-color-primary">
                      {activity.title}
                    </h3>
                    <span className="text-xs text-stone-500">
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600">{activity.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white shadow-sm border space-y-4">
            <h2 className="text-xl font-semibold txt-color-primary">
              System notes
            </h2>
            <ul className="space-y-3 text-sm text-stone-600">
              <li>• Assign a senior technician to escalated tickets.</li>
              <li>• Verify newly uploaded identity documents within 24 hrs.</li>
              <li>• Cross-check technician calendar conflicts every Friday.</li>
              <li>• Confirm marketing banner updates before Monday launch.</li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default AdminPanel;

