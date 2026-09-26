(function () {
  function cfg() { try { return JSON.parse(localStorage.getItem('__mock') || '{}'); } catch (e) { return {}; } }
  var listeners = [];
  window.__calls = { rpc: [], updateUser: [], from: [] };
  var client = {
    auth: {
      getSession: async function () { var c = cfg(); return { data: { session: c.user ? { user: c.user, access_token: 'tok-' + c.user.id } : null }, error: null }; },
      onAuthStateChange: function (cb) { listeners.push(cb); return { data: { subscription: { unsubscribe: function () {} } } }; },
      signOut: async function () { localStorage.setItem('__mock', '{}'); return { error: null }; },
      updateUser: async function (x) { window.__calls.updateUser.push(x); return { data: {}, error: null }; },
      signInWithOAuth: async function () { return { error: null }; },
      signInWithPassword: async function () { return { data: null, error: { message: 'x' } }; },
      signInWithOtp: async function () { return { error: null }; },
      verifyOtp: async function () { return { data: null, error: { message: 'x' } }; },
      resetPasswordForEmail: async function () { return { error: null }; }
    },
    rpc: async function (n) {
      window.__calls.rpc.push(n); var c = cfg();
      return { data: [{ is_pro: !!c.pro, expires_at: c.pro ? new Date(Date.now() + 86400000).toISOString() : null, plan_id: 'x' }], error: null };
    },
    from: function (t) {
      window.__calls.from.push(t);
      var b = { select: function () { return b; }, eq: function () { return b; }, in: function () { return b; }, order: function () { return b; },
        upsert: function () { return Promise.resolve({ error: null }); }, insert: function () { return Promise.resolve({ error: null }); },
        then: function (res) { return Promise.resolve({ data: [], error: null }).then(res); } };
      return b;
    }
  };
  window.supabase = { createClient: function () { return client; } };
})();
